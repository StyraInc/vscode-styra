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
import {IDE} from './vscode-api';
import {info, infoDebug, infoFromUserAction, teeError, teeInfo} from './output-pane';
import {LocalStorageService, Workspace} from './local-storage-service';
import {VersionType} from './types';

export const STYRA_CLI_CMD = 'styra';
const STD_LINUX_INSTALL_DIR = '/usr/local/bin';
const STD_WINDOWS_INSTALL_DIR = path.join(process.env.LOCALAPPDATA ?? '', 'Styra');

export class StyraInstall {

  static TargetOS = process.platform;
  static TargetArch = process.arch;
  static BinaryFile = this.TargetOS === 'win32' ? STYRA_CLI_CMD + '.exe' : STYRA_CLI_CMD;
  static ExePath = this.TargetOS === 'win32' ? STD_WINDOWS_INSTALL_DIR : STD_LINUX_INSTALL_DIR;
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
    const interval = IDE.getConfigValue<number>('styra', 'checkUpdateInterval') ?? 1;
    const currentDate = new Date(Date.now());

    // run check periodically based on user preference in VSCode settings
    if (!last || this.compareDates(currentDate, new Date(last)) >= interval) {
      localStorage.setValue(Workspace.UpdateCheckDate, currentDate.toDateString());
      try {
        const available = await DAS.runQuery('/v1/system/version') as VersionType;
        const installedVersion = await new CommandRunner().runStyraCmdQuietly(
          'version -o jsonpath {.version}'.split(' '));

        if (compare(available.cliVersion, installedVersion) === 1) {
          await StyraInstall.promptForInstall(
            `has an update available (installed=${installedVersion}, available=${available.cliVersion})`, 'update');
        }
      } catch ({message}) {
        teeError(message as string);
      }
    }
  }

  static async styraCmdExists(): Promise<boolean> {
    try {
      await commandExists(STYRA_CLI_CMD);
      return true;
    } catch { /* command does NOT exist; so continue... */ }

    // During the session it was installed, commandExists won't find it!
    // So if that is our situation, check further if actually available.
    // (commandExists should yield true NEXT time VSCode is started)

    const stdCommandCheck = false;
    infoDebug(`styra executable active on search path? ${stdCommandCheck}`);

    const userPath = await new CommandRunner()
        .runPwshCmd(['[Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::User)']);
    const styraPathInPath = userPath.includes(this.ExePath) ?? false;
    infoDebug(`styra executable defined on search path? ${styraPathInPath}`);

    const styraExeExists = fs.existsSync(this.ExeFile);
    infoDebug(`styra executable exists? ${styraExeExists}`);
    return stdCommandCheck || (styraPathInPath && styraExeExists);
  }

  private static async installStyra(): Promise<void> {
    info(`    Platform: ${this.TargetOS}`);
    info(`    Architecture: ${this.TargetArch}`);

    const tempFileLocation = path.join(os.homedir(), this.BinaryFile);

    const url =
      this.TargetOS === 'win32'
        ? 'https://docs.styra.com/v1/docs/bin/windows/amd64/styra.exe'
        : this.TargetOS !== 'darwin'
          ? 'https://docs.styra.com/v1/docs/bin/linux/amd64/styra'
          : this.TargetArch === 'arm64'
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
      moveFile(tempFileLocation, this.ExeFile);
      await this.adjustPath(this.TargetOS, this.ExePath);
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

  private static async adjustPath(targetOS: string, newPathComponent: string): Promise<void> {
    if (process.env.PATH?.includes(newPathComponent)) {
      infoDebug(`${newPathComponent} is already included in env.PATH`);
      return;
    }
    if (targetOS === 'win32') {
      const runner = new CommandRunner();
      infoDebug(`PATH before updating: ${process.env.PATH}`);
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
    } else { // non-windows
      teeError(`${newPathComponent} needs to be on your search PATH`);
    }
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
}
