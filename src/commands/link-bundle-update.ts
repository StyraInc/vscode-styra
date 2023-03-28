import {CommandRunner} from '../lib/command-runner';
import {generatePickList, shouldResume} from './utility';
import {ICommand, ReturnValue} from '../lib/types';
import {info} from '../lib/output-pane';
import {MultiStepInput} from '../external/multi-step-input';
import {QuickPickItem} from '../lib/vscode-api';

interface State {
  _updateBundle: QuickPickItem;
  updateBundle: boolean;
}

export class LinkBundleUpdate implements ICommand {

  title = 'Styra Link Bundle Update';

  async run(): Promise<ReturnValue> {
    const state = await this.collectInputs();
    const styraArgs = ['link', 'bundle', 'update'];
    if (state.updateBundle) {
      styraArgs.push('--refresh');
    }
    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }

  private async collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.updateBundleChoice(input, state));
    return state as State;
  }

  private async updateBundleChoice(input: MultiStepInput, state: Partial<State>): Promise<void> {
    state._updateBundle = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 1,
      totalSteps: 1,
      placeholder: 'Download latest bundle when updating?',
      items: generatePickList(['Yes, download the bundle', 'No, skip the download']),
      activeItem: state._updateBundle,
      shouldResume,
    });
    state.updateBundle = state._updateBundle.label === 'Yes, download the bundle';
  }

}
