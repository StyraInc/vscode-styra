import { checkStartup } from './utility';
import { CommandNotifier } from '../lib/command-notifier';
import { CommandRunner } from '../lib/command-runner';
import { ICommand } from '../lib/types';
import { info } from '../lib/outputPane';
import { STYRA_CLI_CMD } from '../lib/styra-install';

export class LinkValidateDecisions implements ICommand {
  async run(): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier('Link Validate Decisions');
    notifier.markStart();

    try {
      const result = await new CommandRunner().runShellCmd(STYRA_CLI_CMD, ['link', 'validate', 'decisions']);
      info(result);
      notifier.markHappyFinish();
    } catch (err) {
      notifier.markSadFinish();
    }
  }
}
