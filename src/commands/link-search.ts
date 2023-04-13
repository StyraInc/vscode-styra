import {CommandRunner} from '../lib/command-runner';
import {generatePickList, shouldResume, StepType, validateNoop} from './utility';
import {getSetting, Setting} from '../lib/ide-settings';
import {ICommand, ReturnValue} from '../lib/types';
import {info, infoDiagram} from '../lib/output-pane';
import {MultiStepInput} from '../external/multi-step-input';
import {QuickPickItem} from '../lib/vscode-api';

interface State {
  _searchByTitle: QuickPickItem;
  searchByTitle: boolean;
  searchTerm: string;
  format: QuickPickItem;
}

export class LinkSearch implements ICommand {

  title = 'Styra Link Snippets Search';
  totalSteps = 2;
  // For complex editing, just copy the lines here and paste into https://asciiflow.com/#/
  flow = `
                   ┌───────────────────────┐
           ┌──────►│ Full or Partial Title ├────┐
     Title │       └───────────────────────┘    │
           │                                    │
┌┐     ┌───┴─────────┐                          │   ┌┐
│┼────►│ Search Type │                          ├──►├│
└┘     └───┬─────────┘                          │   └┘
           │                                    │
        ID │       ┌───────────────────────┐    │
           └──────►│ Exact snippet ID      ├────┘
                   └───────────────────────┘
`;

  async run(): Promise<ReturnValue> {

    const state = await this.collectInputs();
    const styraArgs = ['link', 'rules', 'search'];
    if (state.searchByTitle) {
      styraArgs.push(state.searchTerm);
    } else {
      styraArgs.push('--rule', state.searchTerm);
    }
    const outputFormat = getSetting<string>(Setting.Format);
    if (outputFormat) {
      styraArgs.push('--output', outputFormat.toLowerCase());
    }

    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }

  private async collectInputs(): Promise<State> {
    infoDiagram(this.title, this.flow);
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.pickSearchType(input, state));
    return state as State;
  }

  private async pickSearchType(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state._searchByTitle = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 1,
      totalSteps: this.totalSteps,
      placeholder: 'Select what to search',
      items: generatePickList(['snippet title (partials OK)', 'snippet id (exact match)']),
      activeItem: state._searchByTitle,
      shouldResume,
    });
    state.searchByTitle = state._searchByTitle.label === 'snippet title (partials OK)';
    return (input: MultiStepInput) => this.inputSearchTerm(input, state);
  }

  private async inputSearchTerm(input: MultiStepInput, state: Partial<State>): Promise<void> {
    state.searchTerm = await input.showInputBox({
      ignoreFocusOut: true,
      title: this.title,
      step: 2,
      totalSteps: this.totalSteps,
      value: state.searchTerm ?? '',
      prompt: `Enter ${state.searchByTitle ? 'portion of a snippet title' : 'exact rule ID'} to search for (case sensitive)`,
      validate: validateNoop,
      shouldResume,
    });
  }

}
