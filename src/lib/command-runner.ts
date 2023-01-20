import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import shellEscape = require('shell-escape');

import { IDE } from './vscode-api';
import { info, teeError } from './outputPane';
import { LocalStorageService, Workspace } from './local-storage-service';
import { STYRA_CLI_CMD, StyraInstall } from './styra-install';

type CommandRunnerOptions = {
  stdinData?: string;
  progressTitle?: string;
}

export class CommandRunner {

  progressMsgs = [
    {msg: 'Starting up', seconds: 0.5},
    {msg: 'Processing', seconds: 5},
    {msg: 'Still running', seconds: 15},
    {msg: 'Whew! Sorry for the wait', seconds: 30},
    {msg: 'Might be headed for a timeout here (perhaps a mistyped value?), but also might just be because you have a sizable tenant', seconds: 60},
  ];

  async runStyraCmd(args: string[], options?: CommandRunnerOptions): Promise<string> {
    const cmd = LocalStorageService.instance.getValue<string>(Workspace.CmdName) ?? '';
    if (!cmd) {
      throw new Error('commands must use CommandNotifier methods to manage the command life cycle');
    }
    options = { ...options, progressTitle: cmd };
    return await this.runShellCmd(STYRA_CLI_CMD, args, options);
  }

  // executes the command at path with args and stdin.
  // Upon success returns the command's output.
  // Upon failure returns the stderr output in an exception.
  async runShellCmd(path: string, args: string[], options?: CommandRunnerOptions): Promise<string> {
    const stdinData = options?.stdinData ?? '';
    const progressTitle = options?.progressTitle ?? '';
    if (!StyraInstall.checkWorkspace()) {
      teeError('Something is wrong! Did you forget to run checkWorkspace in your command?');
      return '';
    }
    // above check guarantees workspaceFolder exists so lint override OK
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cwd = IDE.workspaceFolders()![0].uri.toString().substring('file://'.length);
    info('\nSpawning child process:');
    info(`    project path: ${cwd}`);
    info(`    ${path} ${shellEscape(args)}`);

    // https://nodejs.org/api/child_process.html#child_processspawncommand-args-options 
    const proc = spawn(path, args, { cwd });
    proc.stdin.write(stdinData.endsWith('\n') ? stdinData : stdinData + '\n');
    proc.stdin.end();

    if (progressTitle) {
      return await IDE.withProgress({
        location: IDE.ProgressLocation.Notification,
        title: progressTitle,
        cancellable: false
      }, async (progress, _token) => {
        const timeouts = this.progressMsgs.map(
          ({ msg, seconds }) => setTimeout(() => progress.report({ message: `${msg}...` }), seconds * 1000));
        const result = await this.getResults(proc, path);
        timeouts.forEach((id) => clearTimeout(id));
        return result;
      });
    } else {
      return await this.getResults(proc, path);
    }
  }

  // adapted from https://stackoverflow.com/a/58571306
  private async getResults(proc: ChildProcessWithoutNullStreams, path: string) {
    let data = '';
    for await (const chunk of proc.stdout) {
      data += chunk;
    }
    let error = '';
    for await (const chunk of proc.stderr) {
      error += chunk;
    }
    const exitCode = await new Promise((resolve, _reject) => {
      info(`child process (${path}) complete`);
      proc.on('close', resolve);
    });
    if (exitCode) {
      info(data);
      teeError(error);
      throw new Error(error);
    }
    return data;
  }
}
