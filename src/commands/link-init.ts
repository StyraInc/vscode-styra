import { QuickPickItem } from 'vscode';

import { generatePickList, shouldResume, validateNoop } from './utility';
import { info, infoNewCmd, teeInfo } from '../lib/outputPane';
import { STYRA_CLI_CMD, StyraInstall } from '../lib/styra-install';
import { CommandRunner } from '../lib/command-runner';
import { ICommand } from '../lib/types';
import { MultiStepInput } from '../external/multi-step-input';
import { StyraConfig } from '../lib/styra-config';

interface State {
  folder: string;
  isNewSystem: boolean;
  systemAction: QuickPickItem;
  systemName: string;
  systemType: QuickPickItem;
}

type StepType = (input: MultiStepInput) => Promise<StepType | void>;

export class LinkInit implements ICommand {

  title = 'Styra Link Init';
  stepDelta = 0;
  maxSteps = 4;

  async run(): Promise<void> {

    infoNewCmd('Link Init');

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
    teeInfo(`Linking to ${state.systemName}...`);
    await new CommandRunner().runShellCmd(STYRA_CLI_CMD, [
      'link',
      'init',
      state.isNewSystem ? '--create' : '--existing',
      '--name',
      state.systemName,
      '--path',
      state.folder,
      '--type',
      state.systemType.label,
      '--skip-git',
    ]);
    teeInfo('Link complete');
    info('\n*** Be sure to run "Styra Link: Config Git" next');
  }

  // adapted from vscode-extension-samples/quickinput-sample/src/multiStepInput.ts
  async collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) =>
      this.pickNewOrExistingSystem(input, state)
    );
    return state as State;
  }

  async pickNewOrExistingSystem(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.systemAction = await input.showQuickPick({
      title: this.title,
      step: 1,
      totalSteps: this.maxSteps,
      placeholder: 'Create a new DAS system or connect with an existing one?',
      items: generatePickList(['create new DAS system', 'connect with existing DAS system']),
      activeItem: state.systemAction,
      shouldResume: shouldResume,
    });
    state.isNewSystem = state.systemAction.label === 'create new DAS system';

    if (!state.isNewSystem) {
      this.stepDelta = 1;
    }

    return (input: MultiStepInput) => this.inputSystemName(input, state);
  }

  async inputSystemName(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.systemName = await input.showInputBox({
      title: this.title,
      step: 2,
      totalSteps: this.maxSteps - this.stepDelta,
      value: state.systemName || '',
      prompt: state.isNewSystem
        ? 'Choose a unique name for the DAS System'
        : 'Enter the name of an existing DAS System',
      validate: validateNoop,
      shouldResume: shouldResume,
    });
    return state.isNewSystem
      ? (input: MultiStepInput) => this.pickSystemType(input, state)
      : (input: MultiStepInput) => this.inputFolder(input, state);
  }

  async pickSystemType(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.systemType = await input.showQuickPick({
      title: this.title,
      step: 3,
      totalSteps: this.maxSteps - this.stepDelta,
      placeholder: 'Pick a system type',
      items: generatePickList(['kubernetes', 'envoy']),
      activeItem: state.systemType,
      shouldResume: shouldResume,
    });
    return (input: MultiStepInput) => this.inputFolder(input, state);
  }

  async inputFolder(input: MultiStepInput, state: Partial<State>): Promise<void> {
    state.folder = await input.showInputBox({
      title: this.title,
      step: this.maxSteps - this.stepDelta,
      totalSteps: this.maxSteps - this.stepDelta,
      value: state.folder ?? '',
      prompt: 'Where should policies be stored in the project?',
      validate: validateNoop, // TODO
      shouldResume: shouldResume,
    });
  }

}
