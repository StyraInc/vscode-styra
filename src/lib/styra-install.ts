import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as os from 'os';
import {default as fetch} from 'node-fetch';
import commandExists = require('command-exists');
import moveFile = require('move-file');
import path = require('path');
import {compare} from 'semver';

import {CommandRunner} from './command-runner';
import {DAS} from './das-query';
import {getSetting, Setting} from './ide-settings';
import {IDE} from './vscode-api';
import {info, infoDebug, infoFromUserAction, infoInput, teeError, teeInfo} from './output-pane';
import {LocalStorageService, Workspace} from './local-storage-service';
import {MultiStepInput} from '../external/multi-step-input';
import {shouldResume, validateNoop} from '../commands/utility';
import {VersionType} from './types';

export const STYRA_CLI_CMD = 'styra';
const STD_LINUX_INSTALL_DIR = '/usr/local/bin';
const STD_WINDOWS_INSTALL_DIR = path.join(process.env.LOCALAPPDATA ?? '', 'Styra');

interface State {
  pwd: string;
}

export class StyraInstall {

  static isWindows(): boolean {
    return process.platform === 'win32';
  }

  static BinaryFile = this.isWindows() ? STYRA_CLI_CMD + '.exe' : STYRA_CLI_CMD;
  static ExePath = this.isWindows() ? STD_WINDOWS_INSTALL_DIR : STD_LINUX_INSTALL_DIR;
  static ExeFile = path.join(this.ExePath, this.BinaryFile);

  static checkWorkspace(): boolean {

    const inWorkspace = !!IDE.workspaceFolders();
    if (!inWorkspace) {
      teeError('Styra Link commands must be run with a VSCode project open');
    }
    return inWorkspace;
  }

  static async checkCliInstallation(): Promise<boolean> {
    if (await StyraInstall.styraCmdExists()) {
      infoDebug('Styra CLI is installed');
      return true;
    }
    info('Styra CLI is not installed');
    return await StyraInstall.promptForInstall('is not installed', 'installation');
  }

  private static async promptForInstall(description: string, operation: string): Promise<boolean> {
    // "Cancel" is always shown as the last choice by default
    // Here, just using it to cancel the install itself; the command the user initiated will continue either way.
    const selection = await IDE.showInformationMessageModal(
      `Styra CLI ${description}. Would you like to install it now?`, 'Install');

    if (selection === 'Install') {
      info('Installing Styra CLI. This may take a few minutes...');
      try {
        await this.installStyra();
        teeInfo(`CLI ${operation} completed.`);
        return true;
      } catch (err) {
        teeError(`CLI ${operation} failed: ${err}`);
        return false;
      }
    } else {
      infoFromUserAction(`CLI ${operation} cancelled`);
      return false;
    }
  }

  static async checkForUpdates(): Promise<void> {
    const localStorage = LocalStorageService.instance;
    const last = localStorage.getValue<string>(Workspace.UpdateCheckDate);
    const interval = getSetting<number>(Setting.UpdateInterval);
    const currentDate = new Date(Date.now());

    // run check periodically based on user preference in VSCode settings
    if (!last || this.compareDates(currentDate, new Date(last)) >= interval) {
      localStorage.setValue(Workspace.UpdateCheckDate, currentDate.toDateString());
      try {
        const available = await DAS.runQuery('/v1/system/version') as VersionType;
        const installedVersion = await this.getInstalledCliVersion();
        if (compare(available.cliVersion, installedVersion) === 1) {
          await StyraInstall.promptForInstall(
            `has an update available (installed=${installedVersion}, available=${available.cliVersion})`, 'update');
        }
      } catch (err) {
        teeError((err as Error).message);
      }
    }
  }

  static async reportVersionDetails(): Promise<void> {
    try {
      const versionInfo = await DAS.runQuery('/v1/system/version') as VersionType;
      infoDebug(`DAS release: ${versionInfo.release} `);
      infoDebug(`DAS edition: ${versionInfo.dasEdition} `);
      const cliVersion = await StyraInstall.getInstalledCliVersion();
      infoDebug(`CLI version: ${cliVersion} `);
      if (cliVersion !== versionInfo.cliVersion) {
        infoDebug(`(Latest CLI version: ${versionInfo.cliVersion})`);
      }
      infoDebug(`OPA version: ${versionInfo.opaVersion} `);
    } catch {
      /* no info if not yet configured; just continue on... */
    }
  }

  private static async getInstalledCliVersion(): Promise<string> {
    const result = (await new CommandRunner().runStyraCmdQuietly(
      'version -o jsonpath {.version}'.split(' ')));
    return result.trim(); // remove trailing CR/LF
  }

  static async styraCmdExists(): Promise<boolean> {
    try {
      await commandExists(STYRA_CLI_CMD);
      return true;
    } catch {
      if (!this.isWindows()) {
        return false;
      }
    }
    // continue if !commandExists && isWindows (and notify user of findings thus far)
    infoDebug('styra executable active on search path? false');

    // During the session the CLI was installed, commandExists won't find it!
    // But that is OK; the command-runner still knows how to run it.
    // Thus, the remaining checks here determine if it is, in fact, installed.
    // (commandExists above will yield true the NEXT time VSCode is started)

    const userPath = await new CommandRunner()
        .runPwshCmd(['[Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::User)']);
    const styraPathInPath = userPath.includes(this.ExePath) ?? false;
    infoDebug(`styra executable defined on search path? ${styraPathInPath}`);

    const styraExeExists = fs.existsSync(this.ExeFile);
    infoDebug(`styra executable exists? ${styraExeExists}`);
    return styraPathInPath && styraExeExists;
  }

  private static async installStyra(): Promise<void> {
    info(`    Platform: ${process.platform}`);
    info(`    Architecture: ${process.arch}`);

    const tempFileLocation = path.join(os.homedir(), this.BinaryFile);

    const url =
      process.platform === 'win32'
        ? 'https://docs.styra.com/v1/docs/bin/windows/amd64/styra.exe'
        : process.platform !== 'darwin'
          ? 'https://docs.styra.com/v1/docs/bin/linux/amd64/styra'
          : process.arch === 'arm64'
            ? 'https://docs.styra.com/v1/docs/bin/darwin/arm64/styra'
            : 'https://docs.styra.com/v1/docs/bin/darwin/amd64/styra'; // otherwise target "x64"

    return await IDE.withProgress({
      location: IDE.ProgressLocation.Notification,
      title: 'Installing Styra CLI',
      cancellable: false
    }, async () => {
      await this.getBinary(url, tempFileLocation);
      info(`    Executable: ${this.ExeFile}`);
      fs.chmodSync(tempFileLocation, '755');
      if (this.isWindows()) {
        await moveFile(tempFileLocation, this.ExeFile);
        await this.adjustWindowsPath(this.ExePath);
      } else {
        const state = await this.collectInputs();
        // see https://stackoverflow.com/q/39785436/115690 for ideas on running sudo
        const args = ['-c', `echo ${state.pwd} | sudo -S bash -c 'mv ${tempFileLocation} ${this.ExeFile}'`];
        // vital to run in quiet mode so password does not display
        await new CommandRunner().runShellCmd('sh', args, {progressTitle: '', quiet: true});
      }
    });
  }

  private static async getBinary(url: string, tempFileLocation: string): Promise<void> {
    // adapted from https://stackoverflow.com/a/69290915
    const response = await fetch(url);
    const writeStream = fse.createWriteStream(tempFileLocation, {
      autoClose: true,
      flags: 'w',
    });
    response.body.pipe(writeStream);
    return new Promise((resolve, reject) => {
      writeStream.on('error', reject);
      writeStream.on('finish', resolve);
    });
  }

  private static async adjustWindowsPath(newPathComponent: string): Promise<void> {
    // NB: On Windows it is "Path"; on linux it is "PATH"
    if (process.env.Path?.includes(newPathComponent)) {
      infoDebug(`${newPathComponent} is already included in env.Path`);
      return;
    }
    const runner = new CommandRunner();
    infoDebug(`PATH before updating: ${process.env.Path}`);
    const userPath = await runner
        .runPwshCmd(['[Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User)']);
    infoDebug(`user path before updating: ${userPath}`);
    const updatedPath = this.updatePath(userPath, newPathComponent);
    if (userPath.includes(newPathComponent)) {
      infoDebug(`${newPathComponent} is already included in user PATH (but likely VSCode env has not been refreshed to show it)`);
      return;
    }
    await runner
        .runPwshCmd([`[Environment]::SetEnvironmentVariable("PATH", "${updatedPath}", [EnvironmentVariableTarget]::User)`]);
    infoDebug(`updated user path: ${updatedPath}`);
  }

  private static updatePath(userPath: string, newPathComponent: string): string {
    const pathParts = userPath.split(';') ?? [];
    pathParts.push(newPathComponent);
    return pathParts.join(';');
  }

  private static compareDates(dateA: Date, dateB: Date): number {
    const millisecDifference = dateA.getTime() - dateB.getTime();
    const daysDifference = millisecDifference / (1000 * 3600 * 24);
    return daysDifference;
  }

  private static async collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.inputPwd(input, state));
    return state as State;
  }

  private static async inputPwd(input: MultiStepInput, state: Partial<State>): Promise<void> {
    infoInput('Need your password, please — look at the top of the window.');
    state.pwd = await input.showInputBox({
      ignoreFocusOut: true,
      password: true,
      title: 'CLI Installation',
      step: 1,
      totalSteps: 1,
      value: state.pwd ?? '',
      prompt: `Enter admin password to install into ${STD_LINUX_INSTALL_DIR}`,
      validate: validateNoop,
      shouldResume
    });
  }
}
