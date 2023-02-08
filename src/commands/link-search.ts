import {checkStartup} from '../lib/utility';
import {CommandNotifier} from '../lib/command-notifier';
import {CommandRunner} from '../lib/command-runner';
import {generatePickList, shouldResume, StepType, validateNoop} from './utility';
import {ICommand} from '../lib/types';
import {info, infoDiagram} from '../lib/outputPane';
import {MultiStepInput} from '../external/multi-step-input';
import {QuickPickItem} from 'vscode';

interface State {
  searchTypeRaw: QuickPickItem;
  searchByTitle: boolean;
  searchTerm: string;
  format: QuickPickItem;
}

export class LinkSearch implements ICommand {

  title = 'Styra Link Snippets Search';
  totalSteps = 3;
  // For complex editing, just copy the lines here and paste into https://asciiflow.com/#/
  flow = `
                   ┌───────────────────────┐
           ┌──────►│ Full or Partial Title ├────┐                 Table
     Title │       └───────────────────────┘    │               ┌───────┐
           │                                    │               │       │
┌┐     ┌───┴─────────┐                          │   ┌────────┐  │ JSON  ▼   ┌┐
│┼────►│ Search Type │                          ├──►│ Format ├──┼──────────►├│
└┘     └───┬─────────┘                          │   └────────┘  │       ▲   └┘
           │                                    │               │ YAML  │
        ID │       ┌───────────────────────┐    │               └───────┘
           └──────►│ Exact snippet ID      ├────┘
                   └───────────────────────┘
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
      'rules',
      'search',
    ];
    if (state.searchByTitle) {
      styraArgs.push(state.searchTerm);
    } else {
      styraArgs.push('-r', state.searchTerm);
    }
    styraArgs.push('-o', state.format.label.toLowerCase());

    try {
      const result = await new CommandRunner().runStyraCmd(styraArgs);
      info(result);
      notifier.markHappyFinish();
    } catch {
      notifier.markSadFinish();
    }
  }

  private async collectInputs(): Promise<State> {
    infoDiagram(this.title, this.flow);
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.pickSearchType(input, state));
    return state as State;
  }

  private async pickSearchType(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.searchTypeRaw = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 1,
      totalSteps: this.totalSteps,
      placeholder: 'Select what to search',
      items: generatePickList(['snippet title (partials OK)', 'snippet id (exact match)']),
      activeItem: state.searchTypeRaw,
      shouldResume,
    });
    state.searchByTitle = state.searchTypeRaw.label === 'snippet title (partials OK)';
    return (input: MultiStepInput) => this.inputSearchTerm(input, state);
  }

  private async inputSearchTerm(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.searchTerm = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 2,
      totalSteps: this.totalSteps,
      value: state.searchTerm ?? '',
      prompt: `Enter ${state.searchByTitle ? 'portion of a snippet title' : 'exact rule ID'} to search for`,
      validate: validateNoop,
      shouldResume,
    });
    return (input: MultiStepInput) => this.pickOutputFormat(input, state);
  }

  private async pickOutputFormat(input: MultiStepInput, state: Partial<State>): Promise<void> {
    state.format = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 3,
      totalSteps: this.totalSteps,
      placeholder: 'Select output format',
      items: generatePickList(['table', 'JSON', 'YAML']),
      activeItem: state.format,
      shouldResume,
    });
  }

}
