import {MultiStepInput} from '../external/multi-step-input';

import {checkStartup, generatePickList, shouldResume, StepType, validateNonEmpty, validateNoop} from './utility';
import {CommandNotifier} from '../lib/command-notifier';
import {CommandRunner} from '../lib/command-runner';
import {ICommand} from '../lib/types';
import {info, infoDiagram, infoInput} from '../lib/outputPane';
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
  totalSteps = 6;
  // For complex editing, just copy the lines here and paste into https://asciiflow.com/#/
  flow = `
                           ───
                           2FA         ┌──────────┐
                           ┌──────────►│ Password ├──────────┐
                           │           └──────────┘          │
                      ┌────┴─────┐                           │
         ┌───────────►│ Username │                           │
         │            └────┬─────┘                           │          ┌────────┐
         │                 │           ┌──────────┐          │   ┌─────►│ Commit ├──┐
         │TLS              └──────────►│ Token    ├──────────┤   │      └────────┘  │
         │https://         2FA         └──────────┘          │   │                  │
         │                                                   ▼   │                  │
┌┐    ┌──┴──┐                                            ┌───────┴──┐   ┌────────┐  │      ┌─────────────┐   ┌┐
│┼───►│ URL │                                            │Sync Style├──►│ Branch ├──┼─────►│Git overwrite├──►├│
└┘    └──┬──┘                                            └───────┬──┘   └────────┘  │      └─────────────┘   └┘
         │                                                   ▲   │                  │
         │SSL                           No passphrase        │   │                  │
         │git@             ┌─────────────────────────────────┤   │      ┌────────┐  │
         │                 │                                 │   └─────►│ Tag    ├──┘
         │            ┌────┴─────────                        │          └────────┘
         └───────────►│Key file path │                        │
                      └────┬─────────                        │
                           │           ┌──────────────┐      │
                           └──────────►│Key passphrase├──────┘
                                       └──────────────┘
`;

  async run(): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier(this.title);
    notifier.markStart();

    const state = await this.collectInputs();
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
      state.forceGitOverwrite.label === 'yes' ? '--force' : '',
      '--password-stdin',
    ].concat(variantArgs);
    try {
      const result = await new CommandRunner().runStyraCmd(styraArgs, {stdinData: secret});
      info(result);
      notifier.markHappyFinish();
    } catch {
      notifier.markSadFinish();
    }
  }

  private async collectInputs(): Promise<State> {
    infoDiagram(this.title, this.flow);
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.inputURL(input, state));
    return state as State;
  }

  private async inputURL(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.url = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 1,
      totalSteps: this.totalSteps,
      value: state.url ?? '',
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
      step: 2,
      totalSteps: this.totalSteps,
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
      step: 3,
      totalSteps: this.totalSteps,
      value: state.pwdOrToken ?? '',
      prompt: 'Enter Git access token or password',
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
      step: 2,
      totalSteps: this.totalSteps,
      value: state.keyFilePath ?? '',
      placeholder: 'e.g. /Users/YOU/.ssh/id_ALGORITHM',
      prompt: 'Enter SSH private key file path',
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
      step: 3,
      totalSteps: this.totalSteps,
      value: state.keyPassphrase ?? '',
      prompt: 'Enter SSH private key passphrase',
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
      step: 4,
      totalSteps: this.totalSteps,
      placeholder: 'How would you like to sync your policies?',
      items: generatePickList(['commit', 'branch', 'tag']),
      activeItem: state.syncStyleType,
      shouldResume,
    });
    return (input: MultiStepInput) => this.inputSyncStyleValue(input, state);
  }

  private async inputSyncStyleValue(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    const syncType = state.syncStyleType?.label;
    state.syncStyleValue = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 5,
      totalSteps: this.totalSteps,
      value: state.syncStyleValue ?? '',
      prompt:
        syncType === 'branch' ? 'Enter Git branch (e.g. main)'
          : syncType === 'tag' ? 'Enter Git tag'
            : 'Enter Git commit hash (or HEAD)', // syncType === 'commit'
      validate: validateNonEmpty,
      shouldResume,
    });
    return (input: MultiStepInput) => this.pickForceOverwrite(input, state);
  }

  // TODO: make this a VSCode setting instead of a step
  private async pickForceOverwrite(input: MultiStepInput, state: Partial<State>): Promise<void> {
    state.forceGitOverwrite = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 6,
      totalSteps: this.totalSteps,
      placeholder: 'Would you like to force an overwrite of Git settings if they already exist?',
      items: generatePickList(['yes', 'no']),
      activeItem: state.forceGitOverwrite,
      shouldResume,
    });
  }

  private async validateProtocol(url: string): Promise<string | undefined> {
    return url.startsWith(TLS_PREFIX) || url.startsWith(SSH_PREFIX)
      ? undefined
      : `must start with ${TLS_PREFIX} or ${SSH_PREFIX} `;
  }
}
