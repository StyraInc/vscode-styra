import {CommandRunner} from '../lib/command-runner';
import {ICommand, ReturnValue} from '../lib/types';
import {IDE} from '../lib/vscode-api';
import {info, teeWarning} from '../lib/output-pane';
import {Setting} from '../lib/ide-settings';
import {StyraConfig} from '../lib/styra-config';

export class LinkValidateCompliance implements ICommand {

  title = 'Styra Link Validate Compliance';

  async run(): Promise<ReturnValue> {
    const config = await StyraConfig.getProjectConfig();
    if (config.projectType !== 'kubernetes') {
      teeWarning('This command is only available for the "kubernetes" system type');
      return ReturnValue.Completed;
    }

    const styraArgs = ['link', 'validate', 'compliance'];
    const outputFormat = IDE.getConfigValue<string>('styra', Setting.Format);
    if (outputFormat) {
      styraArgs.push('--output', outputFormat.toLowerCase());
    }
    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }
}
