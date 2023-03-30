/* eslint-disable dot-notation */

import * as fs from 'fs';
import {IDE} from '../../lib/vscode-api';
import {OutputPaneSpy} from '../utility';
import {ProjectConfigData, StyraConfig} from '../../lib/styra-config';
import {SnippetInstaller} from '../../lib/snippet-installer';

describe('SnippetInstaller', () => {

  const spy = new OutputPaneSpy();
  const copySpy = jest.spyOn(fs, 'copyFileSync').mockImplementation(() => '');
  const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => '');
  let installer: SnippetInstaller;

  beforeEach(() => {
    // NB: While this file IS following the best practice of testing behavior rather than implementation,
    // it needs to bother with details of the implementation to do so. Sigh.
    // But it is better than not having the tests at all.
    IDE.getExtension = jest.fn().mockReturnValue({extensionPath: '/ext/root/dir'});
    IDE.projectDir = jest.fn().mockReturnValue('/my/project/dir');
    IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
    StyraConfig.getProjectConfig = jest.fn().mockResolvedValue(
      {projectType: 'kubernetes', name: 'my_project'} as ProjectConfigData);

    installer = new SnippetInstaller();
  });

  test('reports error if IDE does not find extension details', async () => {
    IDE.getExtension = jest.fn().mockReturnValue(undefined);
    installer.addSnippetsToProject();
    expect(spy.content).toMatch(/unable to find Styra extension/);
  });

  test('when no snippets for given system type, skips install', async () => {
    installer['srcFileExists'] = jest.fn().mockReturnValue(false);

    await installer.addSnippetsToProject();

    expect(spy.content).toMatch(/no snippets kubernetes.json available/);
    expect(copySpy).not.toHaveBeenCalled();
  });

  test('when snippet file in project matches source snippet file, reports up-to-date and skips install', async () => {
    installer['srcFileExists'] = jest.fn().mockReturnValue(true);
    installer['destFileExists'] = jest.fn().mockReturnValue(true);
    installer['compareFiles'] = jest.fn().mockResolvedValue(true);

    await installer.addSnippetsToProject();

    expect(spy.content).toMatch(/up-to-date/);
    expect(copySpy).not.toHaveBeenCalled();
  });

  [
    [false, /installing/, 'when snippet file does not exist in project, installs it'],
    [true, /updating/, 'when snippet file exists in project but is not current, updates it']
  ].forEach(([fileExists, postedOutput, description]) => {

    test(description as string, async () => {
      installer['srcFileExists'] = jest.fn().mockReturnValue(true);
      installer['destFileExists'] = jest.fn().mockReturnValue(fileExists);
      installer['compareFiles'] = jest.fn().mockResolvedValue(false);

      await installer.addSnippetsToProject();

      expect(spy.content).toMatch(postedOutput as RegExp);
      expect(copySpy).toHaveBeenCalled();
    });
  });

  [
    [false, 'does not exist, creates it'],
    [true, 'exists, does not create it']
  ].forEach(([dirExists, description]) => {
    test(`when .vscode dir ${description}`, async () => {
      installer['srcFileExists'] = jest.fn().mockReturnValue(true);
      installer['destFileExists'] = jest.fn().mockReturnValue(false);
      installer['destDirExists'] = jest.fn().mockReturnValue(dirExists);

      await installer.addSnippetsToProject();

      expect(mkdirSpy).toBeCalledTimes(dirExists ? 0 : 1);
    });
  });

  [
    ['constructs path to source snippet file based on system type', new RegExp('from: /ext/root/dir/snippets/kubernetes.json')],
    ['constructs path to destination snippet file', new RegExp('to: /my/project/dir/.vscode/styra.code-snippets')]
  ].forEach(([description, postedOutput]) => {

    test(description as string, async () => {
      installer['srcFileExists'] = jest.fn().mockReturnValue(true);

      await installer.addSnippetsToProject();

      expect(spy.content).toMatch(postedOutput as RegExp);
    });
  });

});
