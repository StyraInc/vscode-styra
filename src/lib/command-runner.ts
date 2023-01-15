import * as vscode from 'vscode';
import { spawn } from 'child_process';
import shellEscape = require('shell-escape');

import { info, teeError } from './outputPane';
import { StyraInstall } from './styra-install';


export class CommandRunner {

  // executes the command at path with args and stdin.
  // Upon success returns the command's output.
  // Upon failure returns the stderr output in an exception.
  async runShellCmd( path: string, args: string[], stdinData = ''): Promise<string> {
    if (!StyraInstall.checkWorkspace()) {
      teeError('Something is wrong! Did you forget to run checkWorkspace in your command?');
      return '';
    }
    // above check guarantees workspaceFolder exists so lint override OK
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const cwd = vscode.workspace.workspaceFolders![0].uri.toString().substring('file://'.length);
    info('\nSpawning child process:');
    info(`    project path: ${cwd}`);
    info(`    ${path} ${shellEscape(args)}`);

    // https://nodejs.org/api/child_process.html#child_processspawncommand-args-options 
    const proc = spawn(path, args, { cwd });
    proc.stdin.write(stdinData.endsWith('\n') ? stdinData : stdinData + '\n');
    proc.stdin.end();

    // adapted from https://stackoverflow.com/a/58571306
    let data = '';
    for await (const chunk of proc.stdout) {
      console.log('stdout chunk: ' + chunk);
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
