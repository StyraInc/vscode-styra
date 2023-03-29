import {CommandRunner} from '../lib/command-runner';
import {generatePickList, shouldResume} from './utility';
import {ICommand, ReturnValue} from '../lib/types';
import {info, teeWarning} from '../lib/output-pane';
import {MultiStepInput} from '../external/multi-step-input';
import {QuickPickItem} from '../lib/vscode-api';
import {StyraConfig} from '../lib/styra-config';

interface State {
  format: QuickPickItem;
}

export class LinkValidateCompliance implements ICommand {

  title = 'Styra Link Validate Compliance';

  async run(): Promise<ReturnValue> {
    const config = await StyraConfig.getProjectConfig();
    if (config.projectType !== 'kubernetes') {
      teeWarning('This command is only available for the "kubernetes" system type');
      return ReturnValue.Completed;
    }

    const state = await this.collectInputs();
    const styraArgs = ['link', 'validate', 'compliance', '--output', state.format.label.toLowerCase()];
    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }

  private async collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.pickOutputFormat(input, state));
    return state as State;
  }

  private async pickOutputFormat(input: MultiStepInput, state: Partial<State>): Promise<void> {
    state.format = await input.showQuickPick({
      ignoreFocusOut: true,
      title: this.title,
      step: 1,
      totalSteps: 1,
      placeholder: 'Select output format',
      items: generatePickList(['table', 'JSON', 'YAML']),
      activeItem: state.format,
      shouldResume,
    });
  }
}
