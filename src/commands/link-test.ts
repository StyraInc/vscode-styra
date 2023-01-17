import { info, infoCmdFailed, infoCmdSucceeded, infoNewCmd, teeInfo } from '../lib/outputPane';
import { checkStartup } from './utility';
import { CommandRunner } from '../lib/command-runner';
import { ICommand } from '../lib/types';
import { STYRA_CLI_CMD } from '../lib/styra-install';

export class LinkTest implements ICommand {
  async run(): Promise<void> {

    const CMD = 'Link Test';
    infoNewCmd(CMD);
    if (!(await checkStartup())) {
      return;
    }
    try {
      const result = await new CommandRunner().runShellCmd(STYRA_CLI_CMD, ['link', 'test']);
      info(result);
      infoCmdSucceeded(CMD);
    } catch (err) {
      infoCmdFailed(CMD);
    }
  }
}
