import {CommandRunner} from '../lib/command-runner';
import {ICommand} from '../lib/types';
import {info} from '../lib/outputPane';

export class LinkTest implements ICommand {

  title = 'Styra Link Test';

  async run(): Promise<void> {
    const result = await new CommandRunner().runStyraCmd(['link', 'test']);
    info(result);
  }
}
