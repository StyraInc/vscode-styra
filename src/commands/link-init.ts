import {MultiStepInput} from '../external/multi-step-input';

import {checkStartup} from '../lib/utility';
import {CommandNotifier} from '../lib/command-notifier';
import {CommandRunner} from '../lib/command-runner';
import {generatePickList, shouldResume, StepType, validateNonEmpty} from './utility';
import {ICommand} from '../lib/types';
import {info, infoDiagram} from '../lib/outputPane';
import {QuickPickItem} from '../lib/vscode-api';

interface State {
  folder: string;
  isNewSystem: boolean;
  systemAction: QuickPickItem;
  systemName: string;
  systemType: QuickPickItem;
}

export class LinkInit implements ICommand {

  title = 'Styra Link Init';
  totalSteps = 4;
  // For complex editing, just copy the lines here and paste into https://asciiflow.com/#/
  flow = `
                  ┌──────────┐         ┌─────────────┐
          ┌──────►│ New name ├────────►│ System type ├──┐
       New│       └──────────┘         └─────────────┘  │
          │                                             │
┌┐    ┌───┴────┐                                        │   ┌────────┐   ┌┐
│┼───►│ System │                                        ├──►│ Folder ├──►├│
└┘    └───┬────┘                                        │   └────────┘   └┘
          │                                             │
  Existing│      ┌───────────────┐   ┌───────────────┐  │
          └─────►│ Existing name ├──►│ Existing type ├──┘
                 └───────────────┘   └───────────────┘
`;

  async run(): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier(this.title);
    notifier.markStart();

    const state = await this.collectInputs();
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
      const result = await new CommandRunner().runStyraCmd(styraArgs);
      info(result);
      notifier.markHappyFinish();
      info('\n*** Be sure to run "Styra Link: Config Git" next');
    } catch {
      notifier.markSadFinish();
    }
  }

  private async collectInputs(): Promise<State> {
    infoDiagram(this.title, this.flow);

    // adapted from vscode-extension-samples/quickinput-sample/src/multiStepInput.ts
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) =>
      this.pickNewOrExistingSystem(input, state)
    );
    return state as State;
  }

  private async pickNewOrExistingSystem(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.systemAction = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 1,
      totalSteps: this.totalSteps,
      placeholder: 'Create a new DAS system or connect with an existing one?',
      items: generatePickList(['create new DAS system', 'connect with existing DAS system']),
      activeItem: state.systemAction,
      shouldResume,
    });
    state.isNewSystem = state.systemAction.label === 'create new DAS system';
    return (input: MultiStepInput) => this.inputSystemName(input, state);
  }

  private async inputSystemName(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.systemName = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 2,
      totalSteps: this.totalSteps,
      value: state.systemName || '',
      prompt: state.isNewSystem
        ? 'Choose a unique name for the DAS System'
        : 'Enter the name of an existing DAS System',
      validate: validateNonEmpty,
      shouldResume,
    });
    return (input: MultiStepInput) => this.pickSystemType(input, state);
  }

  private async pickSystemType(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.systemType = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 3,
      totalSteps: this.totalSteps,
      placeholder: 'Pick a system type',
      items: generatePickList(['kubernetes', 'envoy']),
      activeItem: state.systemType,
      shouldResume,
    });
    return (input: MultiStepInput) => this.inputFolder(input, state);
  }

  private async inputFolder(input: MultiStepInput, state: Partial<State>): Promise<void> {
    state.folder = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 4,
      totalSteps: this.totalSteps,
      value: state.folder ?? '',
      prompt: 'Where should policies be stored in the project?',
      validate: validateNonEmpty,
      shouldResume,
    });
  }

}
