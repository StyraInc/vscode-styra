import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkValidateDecisions} from '../../commands/link-validate-decisions';
import {mockVSCodeSettings} from '../utility';

describe('LinkValidateDecisions', () => {

  let runnerMock: jest.Mock;

  beforeEach(() => {
    IDE.showWarningMessage = jest.fn();
    runnerMock = jest.fn().mockResolvedValue('');
    CommandRunner.prototype.runShellCmd = runnerMock;
  });

  test('invokes base link CLI command', async () => {

    IDE.getConfigValue = mockVSCodeSettings();

    await new LinkValidateDecisions().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'validate', 'decisions']),
      expect.anything()
    );
  });

  ['table',
    'JSON',
    'YAML'
  ].forEach((outputFormat) => {
    test(`invokes CLI command with ${outputFormat} format`, async () => {

      IDE.getConfigValue = mockVSCodeSettings({outputFormat});
      await new LinkValidateDecisions().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(['link', 'validate', 'decisions', '--output', outputFormat.toLowerCase()]),
        expect.anything()
      );
    });
  });

});
