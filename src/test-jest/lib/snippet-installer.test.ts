import * as fs from 'fs';
import {IDE} from '../../lib/vscode-api';
import {OutputPaneSpy} from '../utility';
import {ProjectConfigData, StyraConfig} from '../../lib/styra-config';
import {SnippetInstaller} from '../../lib/snippet-installer';

describe('SnippetInstaller', () => {

  const spy = new OutputPaneSpy();

  test('reports error if IDE does not find extension details', async () => {
    IDE.getExtension = jest.fn().mockReturnValue(undefined);
    new SnippetInstaller().addSnippetsToProject();
    expect(spy.content).toMatch(/unable to find Styra extension/);
  });

  test('when snippet file in project matches source snippet file, reports up-to-date and skips install', async () => {
    IDE.getExtension = jest.fn().mockReturnValue({extensionPath: '/ext/root/dir'});
    IDE.projectDir = jest.fn().mockReturnValue('/my/project/dir');
    IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
    const config: ProjectConfigData = {projectType: 'kubernetes', name: 'my_project'};
    StyraConfig.read = jest.fn().mockResolvedValue(config);
    const copySpy = jest.spyOn(fs, 'copyFileSync').mockImplementation(() => '');

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    // eslint-disable-next-line dot-notation
    SnippetInstaller['compareFiles'] = jest.fn().mockResolvedValue(true);

    await new SnippetInstaller().addSnippetsToProject();

    expect(spy.content).toMatch(/up-to-date/);
    expect(copySpy).not.toHaveBeenCalled();

  });

  [
    [false, /installing/, 'when snippet file does not exist in project, installs it'],
    [true, /updating/, 'when snippet file exists in project but is not current, updates it']

  ].forEach(([fileExists, postedOutput, description]) => {

    test(description as string, async () => {
      IDE.getExtension = jest.fn().mockReturnValue({extensionPath: '/ext/root/dir'});
      IDE.projectDir = jest.fn().mockReturnValue('/my/project/dir');
      IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
      const config: ProjectConfigData = {projectType: 'kubernetes', name: 'my_project'};
      StyraConfig.read = jest.fn().mockResolvedValue(config);
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => '');
      const copySpy = jest.spyOn(fs, 'copyFileSync').mockImplementation(() => '');

      jest.spyOn(fs, 'existsSync').mockReturnValue(fileExists as boolean);
      // eslint-disable-next-line dot-notation
      SnippetInstaller['compareFiles'] = jest.fn().mockResolvedValue(false);

      await new SnippetInstaller().addSnippetsToProject();

      expect(spy.content).toMatch(postedOutput as RegExp);
      expect(copySpy).toHaveBeenCalled();
    });
  });

  [
    [false, 'does not exist'],
    [true, 'exists']

  ].forEach(([dirExists, description]) => {
    test(`when .vscode dir ${description} in project, create it`, async () => {
      IDE.getExtension = jest.fn().mockReturnValue({extensionPath: '/ext/root/dir'});
      IDE.projectDir = jest.fn().mockReturnValue('/my/project/dir');
      IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
      const config: ProjectConfigData = {projectType: 'kubernetes', name: 'my_project'};
      StyraConfig.read = jest.fn().mockResolvedValue(config);
      const mkdirSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation(() => '');

      jest.spyOn(fs, 'existsSync').mockImplementation((path) =>
        path === '/my/project/dir/.vscode/styra-snippets.code-snippets' ? false : dirExists as boolean
      );

      await new SnippetInstaller().addSnippetsToProject();

      expect(mkdirSpy).toBeCalledTimes(dirExists ? 0 : 1);
    });
  });

  [
    ['constructs path to source snippet file based on system type', /from: \/ext\/root\/dir\/snippets\/kubernetes.json/],
    ['constructs path to destination snippet file', /to: \/my\/project\/dir\/.vscode\/styra-snippets.code-snippets/]

  ].forEach(([description, postedOutput]) => {

    test(description as string, async () => {
      IDE.getExtension = jest.fn().mockReturnValue({extensionPath: '/ext/root/dir'});
      IDE.projectDir = jest.fn().mockReturnValue('/my/project/dir');
      IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
      const config: ProjectConfigData = {projectType: 'kubernetes', name: 'my_project'};
      StyraConfig.read = jest.fn().mockResolvedValue(config);
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => '');
      jest.spyOn(fs, 'copyFileSync').mockImplementation(() => '');

      await new SnippetInstaller().addSnippetsToProject();

      expect(spy.content).toMatch(postedOutput as RegExp);
    });
  });

});

