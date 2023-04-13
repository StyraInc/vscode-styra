import {CommandRunner} from '../lib/command-runner';
import {getSetting, Setting} from '../lib/ide-settings';
import {ICommand, ReturnValue} from '../lib/types';
import {info} from '../lib/output-pane';

export class LinkTest implements ICommand {

  title = 'Styra Link Test';

  async run(): Promise<ReturnValue> {

    const styraArgs = ['link', 'test'];
    const outputFormat = getSetting<string>(Setting.Format);
    if (outputFormat) {
      styraArgs.push('--output', outputFormat.toLowerCase());
    }
    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }
}
