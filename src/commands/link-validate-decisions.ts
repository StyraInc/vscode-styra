import {CommandRunner} from '../lib/command-runner';
import {ICommand, ReturnValue} from '../lib/types';
import {info} from '../lib/output-pane';

export class LinkValidateDecisions implements ICommand {

  title = 'Styra Link Validate Decisions';

  async run(): Promise<ReturnValue> {
    const result = await new CommandRunner().runStyraCmd(['link', 'validate', 'decisions']);
    info(result);
    return ReturnValue.Completed;
  }
}
