import { info } from '../lib/outputPane';
import { CommandNotifier } from '../lib/command-notifier';
import { checkStartup } from './utility';
import { CommandRunner } from '../lib/command-runner';
import { ICommand } from '../lib/types';
import { STYRA_CLI_CMD } from '../lib/styra-install';

export class LinkTest implements ICommand {
  async run(): Promise<void> {

    const notifier = new CommandNotifier('Link Test');

    notifier.infoNewCmd();
    if (!(await checkStartup())) {
      return;
    }
    try {
      const result = await new CommandRunner().runShellCmd(STYRA_CLI_CMD, ['link', 'test']);
      info(result);
      notifier.infoCmdSucceeded();
    } catch (err) {
      notifier.infoCmdFailed();
    }
  }
}
