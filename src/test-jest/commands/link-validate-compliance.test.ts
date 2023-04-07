import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkValidateCompliance} from '../../commands/link-validate-compliance';
import {mockVSCodeSettings, OutputPaneSpy} from '../utility';
import {ProjectConfigData, StyraConfig} from '../../lib/styra-config';

describe('LinkValidateCompliance', () => {

  let runnerMock: jest.Mock;
  const spy = new OutputPaneSpy();

  beforeEach(() => {
    IDE.showWarningMessage = jest.fn();
    runnerMock = jest.fn().mockResolvedValue('');
    CommandRunner.prototype.runShellCmd = runnerMock;
    StyraConfig.getProjectConfig = jest.fn().mockResolvedValue(
      {projectType: 'kubernetes', name: 'my_project'} as ProjectConfigData);
    IDE.getConfigValue = mockVSCodeSettings();
  });

  test('invokes base link CLI command', async () => {

    await new LinkValidateCompliance().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'validate', 'compliance']),
      expect.anything()
    );
  });

  test('when system is kubernetes, runs the command', async () => {

    await new LinkValidateCompliance().run();

    expect(runnerMock).toHaveBeenCalled();
  });

  test('when system is non-kubernetes, aborts', async () => {
    StyraConfig.getProjectConfig = jest.fn().mockResolvedValue(
      {projectType: 'terraform', name: 'my_project'} as ProjectConfigData);

    await new LinkValidateCompliance().run();

    expect(runnerMock).not.toHaveBeenCalled();
  });

  test('when system is non-kubernetes, informs user', async () => {
    StyraConfig.getProjectConfig = jest.fn().mockResolvedValue(
      {projectType: 'terraform', name: 'my_project'} as ProjectConfigData);

    await new LinkValidateCompliance().run();

    expect(spy.content).toMatch(/only available.*kubernetes/);
  });

  [
    'table',
    'JSON',
    'YAML',
  ].forEach((outputFormat) => {
    test(`invokes CLI command with ${outputFormat} format`, async () => {
      IDE.getConfigValue = mockVSCodeSettings({outputFormat});

      await new LinkValidateCompliance().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(['link', 'validate', 'compliance', '--output', outputFormat.toLowerCase()]),
        expect.anything()
      );
    });
  });

  [
    [true, 'with diagnostic output'],
    [false, 'without diagnostic output']
  ].forEach(([diagnosticOutput, description]) => {
    test(`invokes CLI command ${description}`, async () => {

      IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: diagnosticOutput as boolean});

      await new LinkValidateCompliance().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        diagnosticOutput ?
          expect.arrayContaining(['--debug']) : expect.not.arrayContaining(['--debug']),
        expect.anything()
      );
    });
  });

});
