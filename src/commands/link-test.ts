import {CommandRunner} from '../lib/command-runner';
import {ICommand, ReturnValue} from '../lib/types';
import {info} from '../lib/output-pane';

export class LinkTest implements ICommand {

  title = 'Styra Link Test';

  async run(): Promise<ReturnValue> {
    const result = await new CommandRunner().runStyraCmd(['link', 'test']);
    info(result);
    return ReturnValue.Completed;
  }
}
