import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as os from 'os';
import {default as fetch} from 'node-fetch';
import moveFile = require('move-file');
import path = require('path');
import {sync as commandExistsSync} from 'command-exists';
import {compare} from 'semver';

import {CommandRunner} from './command-runner';
import {DAS} from './das-query';
import {IDE} from './vscode-api';
import {info, infoDebug, infoFromUserAction, teeError, teeInfo} from './outputPane';
import {LocalStorageService, Workspace} from './local-storage-service';
import {VersionType} from './types';

export const STYRA_CLI_CMD = 'styra';

export class StyraInstall {

  static checkWorkspace(): boolean {

    const inWorkspace = !!IDE.workspaceFolders();
    if (!inWorkspace) {
      teeError('Styra Link commands must be run with a VSCode project open');
    }
    return inWorkspace;
  }

  static async checkCliInstallation(): Promise<boolean> {
    if (commandExistsSync(STYRA_CLI_CMD)) {
      infoDebug('Styra CLI is installed');
      return true;
    }
    info('Styra CLI is not installed');

    return await StyraInstall.promptForInstall('is not installed', 'installation');
  }

  private static async promptForInstall(description: string, operation: string): Promise<boolean> {
    // "Cancel" is always shown as the last choice by default
    // Here, just using it ot cancel the install itself; the command the user initiated will continue either way.
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
    if (!last || (currentDate.getDate() - new Date(last).getDate() >= interval)) {

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

  static async installStyra(): Promise<void> {
    const targetOS = process.platform;
    const targetArch = process.arch;
    info(`    Platform: ${targetOS}`);
    info(`    Architecture: ${targetArch}`);

    const binaryFile = targetOS === 'win32' ? STYRA_CLI_CMD + '.exe' : STYRA_CLI_CMD;
    const exeFile = targetOS === 'win32' ? path.join('C:', 'Program Files', 'styra', binaryFile) : path.join('/usr/local/bin/', binaryFile);
    const tempFileLocation = path.join(os.homedir(), binaryFile);

    const url =
      targetOS === 'win32'
        ? 'https://docs.styra.com/v1/docs/bin/windows/amd64/styra.exe'
        : targetOS !== 'darwin'
          ? 'https://docs.styra.com/v1/docs/bin/linux/amd64/styra'
          : targetArch === 'arm64'
            ? 'https://docs.styra.com/v1/docs/bin/darwin/arm64/styra'
            : 'https://docs.styra.com/v1/docs/bin/darwin/amd64/styra'; // otherwise target "x64"

    return await IDE.withProgress({
      location: IDE.ProgressLocation.Notification,
      title: 'Installing Styra CLI',
      cancellable: false
    }, async () => {
      await this.getBinary(url, tempFileLocation);
      info(`    Executable: ${exeFile}`);
      fs.chmodSync(tempFileLocation, '755');
      moveFile(tempFileLocation, exeFile);
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
}
