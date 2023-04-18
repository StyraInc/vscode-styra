import {ChildProcessWithoutNullStreams, spawn, SpawnOptionsWithoutStdio} from 'child_process';
import {sync as commandExistsSync} from 'command-exists';
import shellEscape = require('shell-escape');

import {getSetting, Setting} from './ide-settings';
import {IDE} from './vscode-api';
import {info, infoDebug, teeError} from './output-pane';
import {LocalStorageService, Workspace} from './local-storage-service';
import {STYRA_CLI_CMD, StyraInstall} from './styra-install';

type CommandRunnerOptions = {
  // Data to pipe into stdin for the command.
  stdinData?: string;

  // If present, presents progress bar & messages during cmd execution.
  // Note that `runStyraCmd` by default fills this in with the command name; this automatically
  // provides a progress bar for each command.
  // If, however, you want to run additional shell commands before or after the primary link cmd,
  // you can use this field to override the progress label OR to suppress it (by passing an empty string).
  progressTitle?: string;

  // By default any errors are reported both in the output pane and with a notification to the user.
  // There are cases, though, where we might want to run a query-like command that returns either
  // a result or an error, and is thus an "expected" error.
  // Use `possibleError` to watch for such an expected error, in which case the error text
  // is just returned as normal data and the standard error notification is suppressed.
  possibleError?: string;

  // Also primarily for running additional shell commands before or after the primary link cmd,
  // when true this will suppress the normal diagnostic details emitted to the output pane,
  // so it treats it more like an "internal" operation not revealed to the user.
  quiet?: boolean;
}

export type Environment = { [key: string]: string };

export class CommandRunner {

  progressMsgs = [
    {msg: 'Starting up', seconds: 0.5},
    {msg: 'Processing', seconds: 5},
    {msg: 'Still running', seconds: 15},
    {msg: 'Whew! Sorry for the wait', seconds: 30},
    {msg: 'Might be headed for a timeout here (perhaps a mistyped value?), but also might just be because you have a sizable tenant', seconds: 60},
  ];

  // This should generally be used for running any `styra ...` command.
  // It automatically shows a progress bar with the command name.
  async runStyraCmd(args: string[], options?: CommandRunnerOptions): Promise<string> {
    const cmd = options?.progressTitle ??
      LocalStorageService.instance.getValue<string>(Workspace.CmdName) ?? '';
    if (cmd == null) {
      throw new Error('code error: progressTitle required: use CommandNotifier or pass explicit value');
    }
    return await this.runWithOptionalDebug(args, {...options, progressTitle: cmd});
  }

  // Same as runStyraCmd except does not reveal the command to the user
  async runStyraCmdQuietly(args: string[], possibleError = ''): Promise<string> {
    return await this.runWithOptionalDebug(args, {progressTitle: '', quiet: true, possibleError});
  }

  // One minor inconsistency with diagnostic lines sent to infoDebug here:
  // if the styra link command errors, the entirety of the output
  // has already been logged before returning from `runShellCmd` here,
  // so in that case the diagnostic lines will NOT be prefixed with `[DEBUG]`.
  // Bug? Feature? You decide :-).
  private async runWithOptionalDebug(args: string[], options?: CommandRunnerOptions): Promise<string> {
    if (getSetting<boolean>(Setting.Diagnostic)) {
      args.push('--debug');
      let result = (await this.runShellCmd(STYRA_CLI_CMD, args, options)).split('\n');
      result.filter(this.isDebugLine).forEach(infoDebug);
      result = result.filter((line) => !this.isDebugLine(line));
      return result.join('\n');
    }
    return await this.runShellCmd(STYRA_CLI_CMD, args, options);
  }

  private isDebugLine(line: string): boolean {
    return ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'].filter((debugFlag) => line.startsWith(debugFlag)).length > 0;
  }

  async runPwshCmd(args: string[], options?: CommandRunnerOptions): Promise<string> {
    const pwshCmd = StyraInstall.isWindows() ? 'powershell' : 'pwsh';
    if (!commandExistsSync(pwshCmd)) {
      info(`"${pwshCmd}" not found; aborting...`);
      return '';
    }
    const result = await this.runShellCmd(pwshCmd, ['-NoProfile', '-Command', ...args], options);
    return result.trim(); // importantly remove trailing CR/LF
  }

  // This can be used for any other (non `styra ...`) commands.
  // If options.progressTitle is truthy, it will show a progress bar with that as a prefix.
  // Upon success returns the command's output.
  // Upon failure returns the stderr output in an exception.
  async runShellCmd(path: string, args: string[], options?: CommandRunnerOptions): Promise<string> {
    const stdinData = options?.stdinData ?? '';
    const progressTitle = options?.progressTitle ?? '';
    const possibleError = options?.possibleError ?? '';
    const quiet = options?.quiet ?? false;
    if (!StyraInstall.checkWorkspace()) {
      teeError('Something is wrong! Did you forget to run checkWorkspace in your command?');
      return '';
    }
    const projectDir = IDE.projectDir();
    if (!quiet) {
      info('\nSpawning child process:');
      info(`    project path: ${projectDir}`);
      info(`    ${path} ${shellEscape(args)}`);
    }

    // https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
    const spawnArgs: SpawnOptionsWithoutStdio = {};
    if (projectDir) {
      spawnArgs.cwd = projectDir;
    }

    if (path === STYRA_CLI_CMD && StyraInstall.isWindows() && !process.env.PATH?.includes(StyraInstall.ExePath)) {
      infoDebug('Styra CLI just installed; compensating for search path');
      const combinedEnv = {
        ...process.env,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Path: `${process.env.Path};${StyraInstall.ExePath}`
      };
      spawnArgs.env = combinedEnv;
    }

    const proc = spawn(path, args, spawnArgs);
    proc.on('error', ({message}) => {
      if (!quiet) {
        teeError(`${path} not found: ${message}`);
      }
    });
    proc.stdin.write(stdinData.endsWith('\n') ? stdinData : stdinData + '\n');
    proc.stdin.end();

    if (progressTitle) {
      return await IDE.withProgress({
        location: IDE.ProgressLocation.Notification,
        title: progressTitle,
        cancellable: false
      }, async (progress, _token) => {
        const timeouts = this.progressMsgs.map(
          ({msg, seconds}) => setTimeout(() => progress.report({message: `${msg}...`}), seconds * 1000));
        const result = await this.getResults(proc, path, possibleError, quiet);
        timeouts.forEach((id) => clearTimeout(id));
        return result;
      });
    }
    return await this.getResults(proc, path, possibleError, quiet);

  }

  // adapted from https://stackoverflow.com/a/58571306
  private async getResults(proc: ChildProcessWithoutNullStreams, path: string, possibleError: string, quiet: boolean) {
    let data = '';
    for await (const chunk of proc.stdout) {
      data += chunk;
    }
    let error = '';
    for await (const chunk of proc.stderr) {
      error += chunk;
    }
    const exitCode = await new Promise((resolve, _reject) => {
      if (!quiet) {
        info(`child process (${path}) complete`);
      }
      proc.on('close', resolve);
    });
    if (exitCode) {
      // escape clause to allow a command to return an error as nominal behavior
      if (possibleError && new RegExp(possibleError).test(error)) {
        return error;
      }
      // if not an expected possible error, treat it like, well, a regular error
      info(data);
      throw new Error(error);
    }
    return data;
  }
}
