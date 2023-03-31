/* eslint-disable @typescript-eslint/no-explicit-any */
import {Memento} from 'vscode';

import {CommandRunner} from '../../lib/command-runner';
import {DAS} from '../../lib/das-query';
import {IDE} from '../../lib/vscode-api';
import {LocalStorageService, Workspace} from '../../lib/local-storage-service';
import {mockVSCodeSettings, OutputPaneSpy} from '../utility';
import {StyraInstall} from '../../lib/styra-install';

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

  beforeEach(() => {
    // eslint-disable-next-line dot-notation
    StyraInstall['installStyra'] = jest.fn().mockResolvedValue('');
    StyraInstall.styraCmdExists = jest.fn().mockResolvedValue(false);
    IDE.getConfigValue = mockVSCodeSettings();
  });

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

  describe('checkCLIInstallation', () => {

    [
      [true, /is installed/, 'on path'],
      [false, /is not installed/, 'not on path'],
    ].forEach(([expected, postedOutput, description]) => {

      test(`yields ${expected} when ${description}`, async () => {
        StyraInstall.styraCmdExists = jest.fn().mockResolvedValue(expected);
        IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: true});

        expect(await StyraInstall.checkCliInstallation()).toBe(expected as boolean);

        expect(spy.content).toMatch(postedOutput as RegExp);
      });
    });

    [
      ['Cancel', false, /CLI installation cancelled/],
      ['Install', true, /CLI installation completed/]
    ].forEach(([choice, expected, postedOutput]) => {

      test(`returns ${expected} for ${choice} selection`, async () => {
        IDE.showInformationMessageModal = jest.fn().mockReturnValue(choice);

        expect(await StyraInstall.checkCliInstallation()).toBe(expected as boolean);
        expect(spy.content).toMatch(postedOutput as RegExp);
      });
    });

    test('returns false if installStyra throws an error', async () => {
      IDE.showInformationMessageModal = jest.fn().mockReturnValue('Install');
      // eslint-disable-next-line dot-notation
      StyraInstall['installStyra'] = jest.fn().mockRejectedValue('error');

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
      const showInfoMock = jest.fn().mockReturnValue(undefined);
      IDE.showInformationMessageModal = showInfoMock;

      await StyraInstall.checkForUpdates();

      expect(showInfoMock.mock.calls.join(',')).toMatch(new RegExp(`has an update available.*${installed}.*${available}`));
    });

    [
      ['with a 0-day interval, DOES check update on same day', 0, true, 'Sun Feb 05 2023', 'Sun Feb 05 2023'],
      ['with a 1-day interval, does NOT check update on same day', 1, false, 'Sun Feb 05 2023', 'Sun Feb 05 2023'],
      ['with a 1-day interval, DOES check update next day', 1, true, 'Sun Feb 05 2023', 'Mon Feb 06 2023'],
      ['with a 1-day interval, DOES check update next week', 1, true, 'Sun Feb 05 2023', 'Sun Feb 12 2023'],
      ['with a 5-day interval, does NOT check update next day', 5, false, 'Sun Feb 05 2023', 'Mon Feb 06 2023'],
      ['with a 5-day interval, does NOT check update after 4 days', 5, false, 'Sun Feb 05 2023', 'Thu Feb 09 2023'],
      ['with a 5-day interval, DOES check update after 5 days', 5, true, 'Sun Feb 05 2023', 'Fri Feb 10 2023'],
    ].forEach(([description, interval, wasCalled, lastCheckedDate, currentDate]) => {
      test(description as string, async () => {
        const runQueryMock = jest.fn().mockResolvedValue({cliVersion: '1.2.4'});
        DAS.runQuery = runQueryMock;
        CommandRunner.prototype.runShellCmd = jest.fn().mockResolvedValue('1.2.3');
        const storageMgr = LocalStorageService.instance;
        const storage = new TestMemento();
        storageMgr.storage = storage;
        storageMgr.setValue<string>(Workspace.UpdateCheckDate, lastCheckedDate as string);
        IDE.getConfigValue = mockVSCodeSettings({checkUpdateInterval: interval as number});
        // from https://codewithhugo.com/mocking-the-current-date-in-jest-tests/
        global.Date.now = jest.fn().mockReturnValue(currentDate);

        await StyraInstall.checkForUpdates();

        if (wasCalled) {
          expect(runQueryMock).toHaveBeenCalled();
        } else {
          expect(runQueryMock).not.toHaveBeenCalled();

        }
      });
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
          IDE.showInformationMessageModal = jest.fn().mockReturnValue(choice);

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
      {description: 'available version is invalid', installed: () => '1.2.3', available: () => ({cliVersion: '1.2.x'}), expected: /invalid version/i},
      {description: 'installed version is invalid', installed: () => '1.2.x', available: () => ({cliVersion: '1.2.3'}), expected: /invalid version.*1.2.x$/i},
      {description: 'installed version with newline is invalid', installed: () => '1.2.x\n', available: () => ({cliVersion: '1.2.3'}), expected: /invalid version.*1.2.x$/i},
      {description: 'available callback throws error', installed: () => '1.2.3', available: () => Promise.reject({message: 'error bar'}), expected: /error bar/},
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
