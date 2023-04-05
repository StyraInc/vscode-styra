import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkValidateCompliance} from '../../commands/link-validate-compliance';
import {MultiStepInput} from '../../external/multi-step-input';
import {OutputPaneSpy} from '../utility';
import {ProjectConfigData, StyraConfig} from '../../lib/styra-config';

describe('LinkValidateCompliance', () => {

  let runnerMock: jest.Mock;
  const spy = new OutputPaneSpy();

  beforeEach(() => {
    IDE.getConfigValue = jest.fn().mockReturnValue(true); // getConfigValue('styra', 'debug')
    IDE.showWarningMessage = jest.fn();
    runnerMock = jest.fn().mockResolvedValue('');
    CommandRunner.prototype.runShellCmd = runnerMock;
    StyraConfig.getProjectConfig = jest.fn().mockResolvedValue(
      {projectType: 'kubernetes', name: 'my_project'} as ProjectConfigData);
  });

  test('invokes base link CLI command', async () => {

    MultiStepInput.prototype.showQuickPick = quickPickMock();

    await new LinkValidateCompliance().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'validate', 'compliance']),
      expect.anything()
    );
  });

  test('when system is kubernetes, runs the command', async () => {
    MultiStepInput.prototype.showQuickPick = quickPickMock();

    await new LinkValidateCompliance().run();

    expect(runnerMock).toHaveBeenCalled();
  });

  test('when system is non-kubernetes, aborts', async () => {
    MultiStepInput.prototype.showQuickPick = quickPickMock();
    StyraConfig.getProjectConfig = jest.fn().mockResolvedValue(
      {projectType: 'terraform', name: 'my_project'} as ProjectConfigData);

    await new LinkValidateCompliance().run();

    expect(runnerMock).not.toHaveBeenCalled();
  });

  test('when system is non-kubernetes, informs user', async () => {
    MultiStepInput.prototype.showQuickPick = quickPickMock();
    StyraConfig.getProjectConfig = jest.fn().mockResolvedValue(
      {projectType: 'terraform', name: 'my_project'} as ProjectConfigData);

    await new LinkValidateCompliance().run();

    expect(spy.content).toMatch(/only available.*kubernetes/);
  });

  [
    'table',
    'JSON',
    'YAML',
  ].forEach((format) => {
    test(`invokes CLI command with ${format} format`, async () => {

      MultiStepInput.prototype.showQuickPick = quickPickMock(format);

      await new LinkValidateCompliance().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(['link', 'validate', 'compliance', '--output', format.toLowerCase()]),
        expect.anything()
      );
    });
  });

  const quickPickMock = (format = 'table') => _inputMock(false, format);

  const _inputMock = (isInputBox: boolean, format: string) =>
    jest.fn().mockImplementation(
      ({prompt, placeholder}: { prompt: string, placeholder: string }) => {
        let result: string;
        const target = (isInputBox ? prompt : placeholder).replace(/\s*\(.*\)/, ''); // ignore trailing parenthetical, if any
        switch (target) {
          case 'Select output format':
            result = format;
            break;
          default:
            result = 'UNKNOWN'; // should never happen
        }
        return isInputBox ? result : {label: result};
      });
});
