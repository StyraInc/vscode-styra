import {CommandRunner} from '../lib/command-runner';
import {getSetting, Setting} from '../lib/ide-settings';
import {ICommand, ReturnValue} from '../lib/types';
import {info, teeWarning} from '../lib/output-pane';
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
    const outputFormat = getSetting<string>(Setting.Format);
    if (outputFormat) {
      styraArgs.push('--output', outputFormat.toLowerCase());
    }
    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }
}
