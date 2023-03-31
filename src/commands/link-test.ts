import {CommandRunner} from '../lib/command-runner';
import {ICommand, ReturnValue} from '../lib/types';
import {IDE} from '../lib/vscode-api';
import {info} from '../lib/output-pane';
import {Setting} from '../lib/ide-settings';

export class LinkTest implements ICommand {

  title = 'Styra Link Test';

  async run(): Promise<ReturnValue> {

    const styraArgs = ['link', 'test'];
    const outputFormat = IDE.getConfigValue<string>('styra', Setting.Format);
    if (outputFormat) {
      styraArgs.push('--output', outputFormat.toLowerCase());
    }
    const result = await new CommandRunner().runStyraCmd(styraArgs);
    info(result);
    return ReturnValue.Completed;
  }
}
