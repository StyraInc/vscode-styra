import { MultiStepInput } from '../external/multi-step-input';

import { checkStartup, generatePickList, shouldResume, StepType, validateNonEmpty } from './utility';
import { CommandNotifier } from '../lib/command-notifier';
import { CommandRunner } from '../lib/command-runner';
import { ICommand } from '../lib/types';
import { info, infoInput, teeInfo } from '../lib/outputPane';
import { QuickPickItem } from '../lib/vscode-api';
import { STYRA_CLI_CMD } from '../lib/styra-install';

interface State {
  folder: string;
  isNewSystem: boolean;
  systemAction: QuickPickItem;
  systemName: string;
  systemType: QuickPickItem;
}


export class LinkInit implements ICommand {

  title = 'Styra Link Init';
  stepDelta = 0;
  maxSteps = 4;

  async run(): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier('Link Init');
    notifier.markStart();

    const state = await this.collectInputs();
    teeInfo(`Linking to ${state.systemName}...`);
    const styraArgs = [
        'link',
        'init',
        state.isNewSystem ? '--create' : '--existing',
        '--name',
        state.systemName,
        '--path',
        state.folder,
        '--type',
        state.systemType.label,
        '--skip-git'
    ];
    try {
      const result = await new CommandRunner().runShellCmd(STYRA_CLI_CMD, styraArgs);
      info(result);
      notifier.markHappyFinish();
      info('\n*** Be sure to run "Styra Link: Config Git" next');
    } catch (err) {
      notifier.markSadFinish();
    }
  }

  // adapted from vscode-extension-samples/quickinput-sample/src/multiStepInput.ts
  async collectInputs(): Promise<State> {
    // For complex editing, just copy the lines here and paste into https://asciiflow.com/#/
    infoInput(`Here is the flow of Styra Link Init that you just started:
                ┌──────────┐      ┌─────────────┐
        ┌──────►│ New name ├─────►│ System type ├──┐
     New│       └──────────┘      └─────────────┘  │
        │                                          │
    ┌───┴────┐                                     │   ┌────────┐
    │ System │                                     ├──►│ Folder │
    └───┬────┘                                     │   └────────┘
        │                                          │
Existing│      ┌───────────────┐                   │
        └─────►│ Existing name ├───────────────────┘
               └───────────────┘
    `);
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
      ignoreFocusOut: true,
      title: this.title,
      step: 2,
      totalSteps: this.maxSteps - this.stepDelta,
      value: state.systemName || '',
      prompt: state.isNewSystem
        ? 'Choose a unique name for the DAS System'
        : 'Enter the name of an existing DAS System',
      validate: validateNonEmpty,
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
      ignoreFocusOut: true,
      title: this.title,
      step: this.maxSteps - this.stepDelta,
      totalSteps: this.maxSteps - this.stepDelta,
      value: state.folder ?? '',
      prompt: 'Where should policies be stored in the project?',
      validate: validateNonEmpty, // TODO
      shouldResume: shouldResume,
    });
  }

}
