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
  ].forEach((format) => {
    test(`invokes CLI command with ${format} format`, async () => {

      IDE.getConfigValue = mockVSCodeSettings(format);
      await new LinkValidateDecisions().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(['link', 'validate', 'decisions', '--output', format.toLowerCase()]),
        expect.anything()
      );
    });
  });

});
