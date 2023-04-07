import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkTest} from '../../commands/link-test';
import {mockVSCodeSettings} from '../utility';

describe('LinkTest', () => {

  let runnerMock: jest.Mock;

  beforeEach(() => {
    runnerMock = jest.fn().mockResolvedValue('');
    CommandRunner.prototype.runShellCmd = runnerMock;
  });

  test('invokes base link CLI command', async () => {

    IDE.getConfigValue = mockVSCodeSettings();

    await new LinkTest().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'test']),
      expect.anything()
    );
  });

  [
    'table',
    'JSON',
    'YAML',
  ].forEach((outputFormat) => {
    test(`invokes CLI command with ${outputFormat} format`, async () => {
      IDE.getConfigValue = mockVSCodeSettings({outputFormat});

      await new LinkTest().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(['link', 'test', '--output', outputFormat.toLowerCase()]),
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

      await new LinkTest().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        diagnosticOutput ?
          expect.arrayContaining(['--debug']) : expect.not.arrayContaining(['--debug']),
        expect.anything()
      );
    });
  });

});
