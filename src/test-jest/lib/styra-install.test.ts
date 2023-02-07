/* eslint-disable @typescript-eslint/no-explicit-any */
import {IDE} from '../../lib/vscode-api';
import {StyraInstall} from '../../lib/styra-install';

import * as fs from 'fs';
jest.mock('fs');
import {sync as commandExistsSync} from 'command-exists';
jest.mock('command-exists');
import {OutputPaneSpy} from '../utility';

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
      ['Cancel', false, /Installation cancelled/],
      ['Install', true, /Styra CLI installed/]
    ].forEach(([choice, expected, postedOutput]) => {

      test(`returns ${expected} for ${choice} selection`, async () => {
        (commandExistsSync as unknown as jest.MockInstance<any, any>).mockReturnValue(false);
        IDE.getConfigValue = jest.fn().mockReturnValue(undefined);
        IDE.showInformationMessage = jest.fn().mockReturnValue(choice);
        StyraInstall.installStyra = jest.fn().mockResolvedValue('');

        expect(await StyraInstall.checkCliInstallation()).toBe(expected as boolean);
        expect(spy.content).toMatch(postedOutput as RegExp);
      });

    });
    test('returns false if installStyra throws an error', async () => {
      (commandExistsSync as unknown as jest.MockInstance<any, any>).mockReturnValue(false);
      IDE.getConfigValue = jest.fn().mockReturnValue(undefined);
      IDE.showInformationMessage = jest.fn().mockReturnValue('Install');
      StyraInstall.installStyra = jest.fn().mockRejectedValue('error');

      expect(await StyraInstall.checkCliInstallation()).toBe(false);
      expect(spy.content).toMatch(/CLI installation failed/);
    });
  });


    });
  });
});
