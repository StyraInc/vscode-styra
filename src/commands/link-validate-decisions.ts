import {CommandRunner} from '../lib/command-runner';
import {ICommand} from '../lib/types';
import {info} from '../lib/outputPane';

export class LinkValidateDecisions implements ICommand {

  title = 'Styra Link Validate Decisions';

  async run(): Promise<void> {
    const result = await new CommandRunner().runStyraCmd(['link', 'validate', 'decisions']);
    info(result);
  }
}
