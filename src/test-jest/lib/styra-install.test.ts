/* eslint-disable @typescript-eslint/no-explicit-any */
import {IDE} from '../../lib/vscode-api';
import {StyraInstall} from '../../lib/styra-install';

import * as fs from 'fs';
jest.mock('fs');
import {sync as commandExistsSync} from 'command-exists';
jest.mock('command-exists');
import {CommandRunner} from '../../lib/command-runner';
import {DAS} from '../../lib/das-query';
import {LocalStorageService, Workspace} from '../../lib/local-storage-service';
import {Memento} from 'vscode';
import {OutputPaneSpy} from '../utility';

// copied from local-storage-service.test.ts; importing it fails!?!
class TestMemento implements Memento {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private data: { [key: string]: any } = {};

  public keys(): readonly string[] {
    return Object.keys(this.data);
  }

  public get<T>(key: string): T | undefined {
    return this.data[key];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public update(key: string, value: any): Thenable<void> {
    this.data[key] = value;
    return Promise.resolve();
  }
}

describe('StyraInstall', () => {

  const spy = new OutputPaneSpy();

  describe('checkWorkspace', () => {

    test('returns true and reports no error when in a workspace', () => {
      IDE.workspaceFolders = jest.fn().mockReturnValue(['abc']);
      const errorMock = jest.fn();
      IDE.showErrorMessage = errorMock;

      expect(StyraInstall.checkWorkspace()).toBe(true);
      expect(errorMock.mock.calls.length).toBe(0);
    });

    test('returns false and reports error when NOT in a workspace', () => {
      IDE.workspaceFolders = jest.fn().mockReturnValue(undefined);
      const errorMock = jest.fn();
      IDE.showErrorMessage = errorMock;

      expect(StyraInstall.checkWorkspace()).toBe(false);
      expect(errorMock.mock.calls.length).toBe(1);
    });
  });

  describe('isInstalled', () => {
    [
      [true, 'a', true, true, 'on path, in settings, setting exists'],
      [true, 'a', false, true, 'on path, in settings, setting does not exist'],
      [true, undefined, undefined, true, 'on path, not in settings'],
      [false, 'a', true, true, 'not on path, in settings, setting exists'],
      [false, 'a', false, false, 'not on path, in settings, setting does not exist'],
      [false, undefined, undefined, false, 'not on path, not in settings with undefined'],
      [false, null, undefined, false, 'not on path, not in settings with null'],
    ].forEach(([existsOnPath, settingValue, existsFromSettings, expected, description]) => {

      test(`returns ${expected} when ${description}`, () => {
        (commandExistsSync as unknown as jest.MockInstance<any, any>).mockReturnValue(existsOnPath);
        (fs.existsSync as unknown as jest.MockInstance<any, any>).mockReturnValue(existsFromSettings);
        IDE.getConfigValue = jest.fn().mockReturnValue(settingValue);

        expect(StyraInstall.isInstalled()).toBe(expected);
      });
    });
  });

  describe('checkCLIInstallation', () => {
    [
      ['Cancel', false, /CLI installation cancelled/],
      ['Install', true, /CLI installation completed/]
    ].forEach(([choice, expected, postedOutput]) => {

      test(`returns ${expected} for ${choice} selection`, async () => {
        IDE.getConfigValue = jest.fn().mockReturnValue(undefined);
        IDE.showInformationMessage = jest.fn().mockReturnValue(choice);
        StyraInstall.installStyra = jest.fn().mockResolvedValue('');

        expect(await StyraInstall.checkCliInstallation()).toBe(expected as boolean);
        expect(spy.content).toMatch(postedOutput as RegExp);
      });
    });

    test('returns false if installStyra throws an error', async () => {
      IDE.getConfigValue = jest.fn().mockReturnValue(undefined);
      IDE.showInformationMessage = jest.fn().mockReturnValue('Install');
      StyraInstall.installStyra = jest.fn().mockRejectedValue('error');

      expect(await StyraInstall.checkCliInstallation()).toBe(false);
      expect(spy.content).toMatch(/CLI installation failed/);
    });
  });

  describe('checkForUpdates', () => {

    [
      [null, 'first time executed'],
      ['Sun Feb 05 2023', 'last time run was before today'] // any past date works here
    ].forEach(([targetDate, description]) => {

      test(`checked date is advanced to today when ${description}`, async () => {
        DAS.runQuery = jest.fn().mockResolvedValue({cliVersion: '1.2.4'});
        CommandRunner.prototype.runShellCmd = jest.fn().mockResolvedValue('1.2.3');
        const storageMgr = LocalStorageService.instance;
        const storage = new TestMemento();
        storageMgr.storage = storage;
        storageMgr.setValue<string>(Workspace.UpdateCheckDate, targetDate as string);
        Date.prototype.toDateString = jest.fn()
          .mockReturnValue('Mon Feb 06 2023'); // any date different than targetDate works here

        await StyraInstall.checkForUpdates();

        expect(storageMgr.getValue<string>(Workspace.UpdateCheckDate)).toBe('Mon Feb 06 2023');
      });
    });

    test('reports installed and available versions in the user prompt', async () => {
      const installed = '1.2.3';
      const available = '1.2.4';
      DAS.runQuery = jest.fn().mockResolvedValue({cliVersion: available});
      CommandRunner.prototype.runShellCmd = jest.fn().mockResolvedValue(installed);
      IDE.getConfigValue = jest.fn().mockReturnValue(undefined);
      const showInfoMock = jest.fn().mockReturnValue(undefined);
      IDE.showInformationMessage = showInfoMock;
      StyraInstall.installStyra = jest.fn().mockResolvedValue('');

      await StyraInstall.checkForUpdates();

      expect(showInfoMock.mock.calls.join(',')).toMatch(new RegExp(`has an update available.*${installed}.*${available}`));
    });

    [
      ['Cancel', /CLI update cancelled/],
      ['Install', /CLI update completed/]
    ].forEach(([choice, postedOutput]) => {
      [
        ['1.2.3', '1.2.4', 'installed less than available'],
        ['1.2.3', '1.2.10', 'installed less than available, proving semantic ordering'],
      ].forEach(([installed, available, description]) => {

        test(`prompts for install when ${description}`, async () => {
          DAS.runQuery = jest.fn().mockResolvedValue({cliVersion: available});
          CommandRunner.prototype.runShellCmd = jest.fn().mockResolvedValue(installed);
          IDE.getConfigValue = jest.fn().mockReturnValue(undefined);
          IDE.showInformationMessage = jest.fn().mockReturnValue(choice);
          StyraInstall.installStyra = jest.fn().mockResolvedValue('');

          await StyraInstall.checkForUpdates();

          expect(spy.content).toMatch(postedOutput as RegExp);
        });
      });
    });

    [
      ['1.2.4', '1.2.3', 'installed greater than available'],
      ['1.2.4', '1.2.4', 'installed equals available'],
      ['1.20.4', '1.2.5', 'installed greater than available in other-than-last-octet'],
    ].forEach(([installed, available, description]) => {

      test(`does NOT prompt for install when ${description}`, async () => {
        DAS.runQuery = jest.fn().mockResolvedValue({cliVersion: available});
        CommandRunner.prototype.runShellCmd = jest.fn().mockResolvedValue(installed);
        const installMock = jest.fn();
        // eslint-disable-next-line dot-notation
        StyraInstall['promptForInstall'] = installMock;

        await StyraInstall.checkForUpdates();

        expect(installMock).not.toHaveBeenCalled();
      });
    });

    [
      {description: 'available version is invalid', installed: () => ({cliVersion: '1.2.3'}), available: () => ({cliVersion: '1.2.x'}), expected: /invalid version/i},
      {description: 'installed version is invalid', installed: () => ({cliVersion: '1.2.x'}), available: () => ({cliVersion: '1.2.3'}), expected: /invalid version/i},
      {description: 'available callback throws error', installed: () => ({cliVersion: '1.2.3'}), available: () => Promise.reject({message: 'error bar'}), expected: /error bar/},
      {description: 'installed callback throws error', installed: () => Promise.reject({message: 'error foo'}), available: () => ({cliVersion: '1.2.3'}), expected: /error foo/},
    ].forEach(({description, installed, available, expected}) => {

      test(`does NOT prompt for install and reports error when ${description}`, async () => {
        DAS.runQuery = jest.fn().mockImplementation(available);
        CommandRunner.prototype.runShellCmd = jest.fn().mockImplementation(installed);
        const installMock = jest.fn();
        // eslint-disable-next-line dot-notation
        StyraInstall['promptForInstall'] = installMock;

        await StyraInstall.checkForUpdates();

        expect(installMock).not.toHaveBeenCalled();
        expect(spy.content).toMatch(expected);
      });
    });

  });
});
