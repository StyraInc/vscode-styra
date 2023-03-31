import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkValidateDecisions} from '../../commands/link-validate-decisions';

describe('LinkValidateDecisions', () => {

  let runnerMock: jest.Mock;

  beforeEach(() => {
    IDE.showWarningMessage = jest.fn();
    runnerMock = jest.fn().mockResolvedValue('');
    CommandRunner.prototype.runShellCmd = runnerMock;
  });

  test('invokes base link CLI command', async () => {

    IDE.getConfigValue = configMock();

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

      IDE.getConfigValue = configMock(format);
      await new LinkValidateDecisions().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(['link', 'validate', 'decisions', '--output', format.toLowerCase()]),
        expect.anything()
      );
    });
  });

  const configMock = (format = 'table') => jest.fn().mockImplementation(
    (path, key) => {
      switch (key) {
        case 'outputFormat':
          return format;
        case 'diagnosticOutput':
          return true;
      }
    });

});
