/* eslint-disable @typescript-eslint/no-explicit-any */
import { IDE } from '../../lib/vscode-api';
import { StyraInstall } from '../../lib/styra-install';

import * as fs from 'fs';
jest.mock('fs');
import { sync as commandExistsSync } from 'command-exists';
jest.mock('command-exists');

describe('StyraInstall', () => {

  test('checkWorkspace returns true and reports no error when in a workspace', () => {
    IDE.workspaceFolders = jest.fn().mockReturnValue(['abc']);
    const errorMock = jest.fn();
    IDE.showErrorMessage = errorMock;

    expect(StyraInstall.checkWorkspace()).toBe(true);
    expect(errorMock.mock.calls.length).toBe(0);
  });

  test('checkWorkspace returns false and reports error when in a workspace', () => {
    IDE.workspaceFolders = jest.fn().mockReturnValue(undefined);
    const errorMock = jest.fn();
    IDE.showErrorMessage = errorMock;

    expect(StyraInstall.checkWorkspace()).toBe(false);
    expect(errorMock.mock.calls.length).toBe(1);
  });

  [
    [true, 'a', true, true, 'on path, in settings, setting exists'],
    [true, 'a', false, true, 'on path, in settings, setting does not exist'],
    [true, undefined, undefined, true, 'on path, not in settings'],
    [false, 'a', true, true, 'not on path, in settings, setting exists'],
    [false, 'a', false, false, 'not on path, in settings, setting does not exist'],
    [false, undefined, undefined, false, 'not on path, not in settings with undefined'],
    [false, null, undefined, false, 'not on path, not in settings with null'],
  ].forEach(([existsOnPath, settingValue, existsFromSettings, expected, description]) => {

    test(`isInstalled returns ${expected} when ${description}`, () => {
      (commandExistsSync as unknown as jest.MockInstance<any, any>).mockImplementation(() => existsOnPath);
      (fs.existsSync as unknown as jest.MockInstance<any, any>).mockImplementation(() => existsFromSettings);
      IDE.getConfigValue = jest.fn().mockReturnValue(settingValue);

      expect(StyraInstall.isInstalled()).toBe(expected);
    });
  });

  [
    ['Cancel', false],
    ['Install', true]
  ].forEach(([choice, expected]) => {

    test(`checkCLIInstallation returns ${expected} for ${choice} selection`, async () => {
      (commandExistsSync as unknown as jest.MockInstance<any, any>).mockImplementation(() => false);
      IDE.getConfigValue = jest.fn().mockReturnValue(undefined);
      IDE.showInformationMessage = jest.fn().mockReturnValue(choice);
      StyraInstall.installStyra = jest.fn().mockResolvedValue('');

      expect(await StyraInstall.checkCliInstallation()).toBe(expected);
    });
  });
});
