import {CommandRunner} from '../lib/command-runner';
import {ICommand, ReturnValue} from '../lib/types';
import {IDE} from '../lib/vscode-api';
import {info} from '../lib/output-pane';

export class LinkValidateDecisions implements ICommand {

  title = 'Styra Link Validate Decisions';

  async run(): Promise<ReturnValue> {

    const styraArgs = ['link', 'validate', 'decisions'];
    const outputFormat = IDE.getConfigValue<string>('styra', 'outputFormat');
    if (outputFormat) {
      styraArgs.push('--output', outputFormat.toLowerCase());
    }
    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }
}
