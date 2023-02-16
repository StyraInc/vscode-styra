import {MultiStepInput} from '../external/multi-step-input';

import {CommandRunner} from '../lib/command-runner';
import {footnoteMsg, info, infoDiagram, infoInput} from '../lib/outputPane';
import {generatePickList, shouldResume, StepType, validateNonEmpty, validateNoop} from './utility';
import {ICommand, ReturnValue} from '../lib/types';
import {QuickPickItem} from '../lib/vscode-api';

interface State {
  forceGitOverwrite: QuickPickItem;
  keyFilePath: string;
  keyPassphrase: string;
  pwdOrToken: string;
  syncStyleType: QuickPickItem;
  syncStyleValue: string;
  url: string;
  username: string;
}

const TLS_PREFIX = 'https://';
const SSH_PREFIX = 'git@';

export class LinkConfigGit implements ICommand {

  title = 'Styra Link Config Git';
  step = {total: 0, delta: 0};
  existingGitConfigURL = ''
  // For complex editing, just copy the lines here and paste into https://asciiflow.com/#/
  flow = `
                          Exit  ┌┐                    ───
                    ┌──────────►├│                    2FA         ┌──────────┐
                    │           └┘                    ┌──────────►│ Password ├──────────┐
                    │No                               │           └──────────┘          │
           ┌────────┴─────┐                      ┌────┴─────┐                           │
     ┌────►│Overwrite Git?├──┐      ┌───────────►│ Username │                           │
     │     └──────────────┘  │      │            └────┬─────┘                           │          ┌────────┐
     │                       │      │                 │           ┌──────────┐          │   ┌─────►│ Commit ├──┐
     │Git                Yes │      │TLS              └──────────►│ Token    ├──────────┤   │      └────────┘  │
     │Previously             │      │https://         2FA         └──────────┘          │   │                  │
     │Configured             │      │                                                   ▼   │                  │
┌┐   │                       │   ┌──┴──┐                                            ┌───────┴──┐   ┌────────┐  │   ┌┐
│┼───┤                       ├──►│ URL │                                            │Sync Style├──►│ Branch ├──┼──►├│
└┘   │                       │   └──┬──┘                                            └───────┬──┘   └────────┘  │   └┘
     │                       │      │                                                   ▲   │                  │
     │No                     │      │SSL                           No passphrase        │   │                  │
     │Previous               │      │git@             ┌─────────────────────────────────┤   │      ┌────────┐  │
     │Configuration          │      │                 │                                 │   └─────►│ Tag    ├──┘
     │                       │      │            ┌────┴────────┐                        │          └────────┘
     └───────────────────────┘      └───────────►│Key file path│                        │
                                                 └────┬────────┘                        │
                                                      │           ┌──────────────┐      │
                                                      └──────────►│Key passphrase├──────┘
                                                                  └──────────────┘
`;

  async run(): Promise<ReturnValue> {

    this.existingGitConfigURL = await this.getExistingGitURL();

    const state = await this.collectInputs();
    if (state.forceGitOverwrite?.label === 'no') {
      return ReturnValue.TerminatedByUser;
    }
    let variantArgs = [] as string[];
    let secret = '';
    if (state.username) {
      variantArgs = ['--username', state.username];
      secret = state.pwdOrToken;
    } else {
      variantArgs = ['--key-file', state.keyFilePath];
      secret = state.keyPassphrase;
    }
    const styraArgs = [
      'link',
      'config',
      'git',
      state.url,
      // '--debug', // TODO: Wire up a VSCode setting to toggle this
      `--${state.syncStyleType.label}`,
      state.syncStyleValue,
      state.forceGitOverwrite?.label === 'yes' ? '--force' : '',
      '--password-stdin',
    ].concat(variantArgs);
    const result = await new CommandRunner().runStyraCmd(styraArgs, {stdinData: secret});
    info(result);
    return ReturnValue.Completed;
  }

  private async getExistingGitURL() {
    // allow returning either an error or a git URL for this command
    const possibleError = 'source_control is not found';
    const result = await new CommandRunner().runStyraCmdQuietly(
      'link config read -s system -o jsonpath {.source_control..url}'.split(' '),
      possibleError
    );
    // returns prior git URL iff it exists (i.e. no error)
    return new RegExp(possibleError).test(result as string) ? '' : result;
  }

  private async collectInputs(): Promise<State> {
    infoDiagram(this.title, this.flow);
    const state = {} as Partial<State>;
    this.step = this.existingGitConfigURL ? {total: 6, delta: 0} : {total: 5, delta: -1};
    await MultiStepInput.run((input) =>
      this.existingGitConfigURL
        ? this.pickForceOverwrite(input, state)
        : this.inputURL(input, state)
    );
    return state as State;
  }

  private async pickForceOverwrite(input: MultiStepInput, state: Partial<State>): Promise<StepType | void> {
    infoInput(`This system appears to already be configured for git integration
    Remote repository: ${this.existingGitConfigURL}`);
    state.forceGitOverwrite = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 1,
      totalSteps: this.step.total,
      placeholder: `Do you want to overwrite this configuration? ${footnoteMsg}`,
      items: generatePickList(['yes', 'no']),
      activeItem: state.forceGitOverwrite,
      shouldResume,
    });
    if (state.forceGitOverwrite.label === 'yes') {
      return (input: MultiStepInput) => this.inputURL(input, state);
    }
  }

  private async inputURL(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.url = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 2 + this.step.delta,
      totalSteps: this.step.total,
      value: state.url ?? '',
      placeholder: 'git@... or https://...',
      prompt: 'Enter remote Git URL',
      validate: this.validateProtocol,
      shouldResume,
    });
    return state.url.startsWith(TLS_PREFIX)
      ? (input: MultiStepInput) => this.inputUserName(input, state)
      : (input: MultiStepInput) => this.inputKeyFilePath(input, state);
  }

  private async inputUserName(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.username = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 3 + this.step.delta,
      totalSteps: this.step.total,
      value: state.username ?? '',
      prompt: 'Enter Git user name',
      validate: validateNonEmpty,
      shouldResume,
    });
    return (input: MultiStepInput) => this.inputPwdOrToken(input, state);
  }

  private async inputPwdOrToken(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    infoInput(`If you are using 2FA (two-factor authentication) on your Git login you must use a token rather than a password
    Reference: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
    Alternately, you can use SSH for authentication by backing up to the first input (the URL) in the input dialog
    and enter a URL beginning with "git@"`);

    state.pwdOrToken = await input.showInputBox({
      ignoreFocusOut: true,
      password: true,
      title: this.title,
      step: 4 + this.step.delta,
      totalSteps: this.step.total,
      value: state.pwdOrToken ?? '',
      prompt: `Enter Git access token or password ${footnoteMsg}`,
      validate: validateNonEmpty,
      shouldResume,
    });
    return (input: MultiStepInput) => this.pickSyncStyle(input, state);
  }

  private async inputKeyFilePath(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    infoInput(`The private key file path path is typically /Users/YOU/.ssh/id_ALGORITHM
    Reference: https://docs.github.com/en/authentication/connecting-to-github-with-ssh/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent`);
    state.keyFilePath = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 3 + this.step.delta,
      totalSteps: this.step.total,
      value: state.keyFilePath ?? '',
      placeholder: '/Users/YOU/.ssh/id_ALGORITHM',
      prompt: `Enter SSH private key file path ${footnoteMsg}`,
      validate: validateNonEmpty,
      shouldResume,
    });
    return (input: MultiStepInput) => this.inputKeyPassphrase(input, state);
  }

  private async inputKeyPassphrase(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    infoInput('The private key passphrase is required only if your private key file is passphrase protected');
    state.keyPassphrase = await input.showInputBox({
      ignoreFocusOut: true,
      password: true,
      title: this.title,
      step: 4 + this.step.delta,
      totalSteps: this.step.total,
      value: state.keyPassphrase ?? '',
      prompt: `Enter SSH private key passphrase ${footnoteMsg}`,
      validate: validateNoop,
      shouldResume,
    });
    return (input: MultiStepInput) => this.pickSyncStyle(input, state);
  }

  private async pickSyncStyle(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    infoInput('In the next step you specify the target of your selection here');
    state.syncStyleType = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 5 + this.step.delta,
      totalSteps: this.step.total,
      placeholder: `How would you like to sync your policies? ${footnoteMsg}`,
      items: generatePickList(['commit', 'branch', 'tag']),
      activeItem: state.syncStyleType,
      shouldResume,
    });
    return (input: MultiStepInput) => this.inputSyncStyleValue(input, state);
  }

  private async inputSyncStyleValue(input: MultiStepInput, state: Partial<State>): Promise<void> {
    const syncType = state.syncStyleType?.label;
    state.syncStyleValue = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 6 + this.step.delta,
      totalSteps: this.step.total,
      value: state.syncStyleValue ?? '',
      placeholder:
        syncType === 'branch' ? 'main'
          : syncType === 'tag' ? ''
            : 'HEAD (or commit hash)', // syncType === 'commit'
      prompt:
        syncType === 'branch' ? 'Enter Git branch'
          : syncType === 'tag' ? 'Enter Git tag'
            : 'Enter Git commit hash',
      validate: validateNonEmpty,
      shouldResume,
    });
  }

  private async validateProtocol(url: string): Promise<string | undefined> {
    return url.startsWith(TLS_PREFIX) || url.startsWith(SSH_PREFIX)
      ? undefined
      : `must start with ${TLS_PREFIX} or ${SSH_PREFIX} `;
  }
}
