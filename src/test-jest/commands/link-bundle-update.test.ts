import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {LinkBundleUpdate} from '../../commands/link-bundle-update';
import {mockVSCodeSettings} from '../utility';
import {MultiStepInput} from '../../external/multi-step-input';

describe('LinkBundleUpdate', () => {

  let runnerMock: jest.Mock;

  beforeEach(() => {
    IDE.getConfigValue = mockVSCodeSettings();
    runnerMock = jest.fn().mockResolvedValue('');
    CommandRunner.prototype.runShellCmd = runnerMock;
  });

  test('invokes base link CLI command', async () => {

    const shouldRefresh = false;
    MultiStepInput.prototype.showQuickPick = quickPickMock(shouldRefresh);

    await new LinkBundleUpdate().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'bundle', 'update']),
      expect.anything()
    );
    expect(runnerMock).not.toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'bundle', 'update', '--refresh']),
      expect.anything()
    );
  });

  test('invokes link CLI command with refresh argument', async () => {

    const shouldRefresh = true;
    MultiStepInput.prototype.showQuickPick = quickPickMock(shouldRefresh);

    await new LinkBundleUpdate().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'bundle', 'update', '--refresh']),
      expect.anything()
    );
  });

  const quickPickMock = (update = true) => _inputMock(false, update);

  const _inputMock = (isInputBox: boolean, update: boolean) =>
    jest.fn().mockImplementation(
      ({prompt, placeholder}: { prompt: string, placeholder: string }) => {
        let result: string;
        const target = (isInputBox ? prompt : placeholder).replace(/\s*\(.*\)/, ''); // ignore trailing parenthetical, if any
        switch (target) {
          case 'Download latest bundle when updating?':
            result = update ? 'Yes, download the bundle' : 'No, skip the download';
            break;
          default:
            result = 'UNKNOWN'; // should never happen
        }
        return isInputBox ? result : {label: result};
      });

});
