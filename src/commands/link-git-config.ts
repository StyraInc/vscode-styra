import { generatePickList, shouldResume, validateNoop } from './utility';
import { info, infoNewCmd, teeInfo } from '../lib/outputPane';
import { STYRA_CLI_CMD, StyraInstall } from '../lib/styra-install';
import { CommandRunner } from '../lib/command-runner';
import { ICommand } from '../lib/types';
import { MultiStepInput } from '../external/multi-step-input';
import { QuickPickItem } from 'vscode';
import { StyraConfig } from '../lib/styra-config';

interface State {
  forceGitOverwrite: boolean;
  keyFilePath: string;
  keyPassphrase: string;
  secret: string;
  syncStyleType: QuickPickItem;
  syncStyleValue: string;
  url: string;
  username: string;
}

type StepType = (input: MultiStepInput) => Promise<StepType | void>;

const TLS_PREFIX = 'https://';
const SSH_PREFIX = 'git@';

export class LinkGitConfig implements ICommand {
  title = 'Styra Link Config Git';
  stepDelta = 0;
  maxSteps = 5;

  async run(): Promise<void> {
    infoNewCmd('Link Config Git');

    if (!StyraInstall.checkWorkspace()) {
      return;
    }
    if (!(await StyraInstall.checkCliInstallation())) {
      return;
    }
    if (!(await StyraConfig.checkCliConfiguration())) {
      return;
    }

    const state = await this.collectInputs();
    try {
      await new CommandRunner().runShellCmd(STYRA_CLI_CMD, [
        'link',
        'config',
        'git',
        state.url,
        `--${state.syncStyleType.label}`,
        state.syncStyleValue,
        state.forceGitOverwrite ? '--force' : '',
      ]);
      teeInfo('Link config git complete');
    } catch (err) {
      info('link config git failed'); // err already displayed so not emitting again here
    }
  }

  // adapted from vscode-extension-samples/quickinput-sample/src/multiStepInput.ts
  async collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.inputURL(input, state));
    return state as State;
  }

  async inputURL(
    input: MultiStepInput,
    state: Partial<State>
  ): Promise<StepType> {
    state.url = await input.showInputBox({
      title: this.title,
      step: 1,
      totalSteps: this.maxSteps,
      value: state.url || '',
      prompt: 'Enter remote Git URL',
      validate: this.validateProtocol,
      shouldResume: shouldResume,
    });
    return state.url.startsWith(TLS_PREFIX)
      ? (input: MultiStepInput) => this.inputUserName(input, state)
      : (input: MultiStepInput) => this.inputKeyFilePath(input, state);
  }

  async inputUserName(
    input: MultiStepInput,
    state: Partial<State>
  ): Promise<StepType> {
    state.username = await input.showInputBox({
      title: this.title,
      step: 2,
      totalSteps: this.maxSteps,
      value: state.username || '',
      prompt: 'Enter Git user name',
      validate: validateNoop,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => this.inputSecret(input, state);
  }

  async inputSecret(
    input: MultiStepInput,
    state: Partial<State>
  ): Promise<StepType> {
    state.secret = await input.showInputBox({
      title: this.title,
      step: 3,
      totalSteps: this.maxSteps,
      value: state.secret || '',
      prompt: 'Enter Git secret (access token or password)',
      validate: validateNoop,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => this.pickSyncStyle(input, state);
  }

  async inputKeyFilePath(
    input: MultiStepInput,
    state: Partial<State>
  ): Promise<StepType> {
    state.keyFilePath = await input.showInputBox({
      title: this.title,
      step: 2,
      totalSteps: this.maxSteps,
      value: state.keyFilePath || '',
      prompt: 'Enter SSH private key file path',
      validate: validateNoop,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => this.inputKeyPassphrase(input, state);
  }

  async inputKeyPassphrase(
    input: MultiStepInput,
    state: Partial<State>
  ): Promise<StepType> {
    state.keyPassphrase = await input.showInputBox({
      title: this.title,
      step: 3,
      totalSteps: this.maxSteps,
      value: state.keyPassphrase || '',
      prompt: 'Enter SSH private key passphrase',
      validate: validateNoop,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => this.pickSyncStyle(input, state);
  }

  async pickSyncStyle(
    input: MultiStepInput,
    state: Partial<State>
  ): Promise<StepType> {
    state.syncStyleType = await input.showQuickPick({
      title: this.title,
      step: 4,
      totalSteps: this.maxSteps,
      placeholder: 'How would you like to sync your policies?',
      items: generatePickList(['commit', 'branch', 'tag']),
      activeItem: state.syncStyleType,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => this.inputSyncStyleValue(input, state);
  }

  async inputSyncStyleValue(
    input: MultiStepInput,
    state: Partial<State>
  ): Promise<void> {
    const syncType = state.syncStyleType?.label;
    state.syncStyleValue = await input.showInputBox({
      title: this.title,
      step: 5,
      totalSteps: this.maxSteps,
      value: state.syncStyleValue || '',
      prompt:
        syncType === 'branch' ? 'Enter Git branch (e.g. main)'
          : syncType === 'tag' ? 'Enter Git tag'
          : 'Enter Git commit hash (or HEAD)', // syncType === 'commit'
      validate: validateNoop,
      shouldResume: shouldResume,
    });
  }

  async validateProtocol(url: string): Promise<string | undefined> {
    return url.startsWith(TLS_PREFIX) || url.startsWith(SSH_PREFIX)
      ? undefined
      : `must start with ${TLS_PREFIX} or ${SSH_PREFIX} `;
  }
}
