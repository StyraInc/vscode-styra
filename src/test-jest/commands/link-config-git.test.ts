import {CommandRunner} from '../../lib/command-runner';
import {footnoteMsg} from '../../lib/output-pane';
import {IDE} from '../../lib/vscode-api';
import {LinkConfigGit} from '../../commands/link-config-git';
import {MultiStepInput} from '../../external/multi-step-input';
import {ReturnValue} from '../../lib/types';

describe('LinkConfigGit', () => {

  let runnerMock: jest.Mock;

  beforeEach(() => {
    IDE.getConfigValue = jest.fn().mockReturnValue(false); // getConfigValue('styra', 'debug')

    // most types do not care about the return value; setting up for the one that does
    runnerMock = jest.fn().mockResolvedValue('git@dummyUrlHere.git');
    CommandRunner.prototype.runShellCmd = runnerMock;

    // provide responses to user inputs
    MultiStepInput.prototype.showQuickPick = quickPickMock();
    MultiStepInput.prototype.showInputBox = inputBoxMock();
  });

  test('invokes link command to configure git', async () => {

    await new LinkConfigGit().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'config', 'git']),
      expect.anything()
    );
  });

  test('invokes link command to fetch existing git URL, if any', async () => {

    await new LinkConfigGit().run();

    expect(runnerMock).toHaveBeenCalledWith(
      'styra',
      expect.arrayContaining(['link', 'config', 'read', '{.source_control..url}']),
      expect.anything()
    );
  });

  test('command TERMINATES when previous git config present and user chooses NOT to overwrite', async () => {
    MultiStepInput.prototype.showQuickPick = quickPickMock({overwrite: false});

    const result = await new LinkConfigGit().run();

    expect(result).toBe(ReturnValue.TerminatedByUser);
  });

  test('command COMPLETES when previous git config present and user chooses TO overwrite', async () => {
    MultiStepInput.prototype.showQuickPick = quickPickMock({overwrite: true});

    const result = await new LinkConfigGit().run();

    expect(result).toBe(ReturnValue.Completed);
  });

  [
    [true, 'WITH previous git config, force param IS passed'],
    [false, 'WITHOUT previous git config, force param is NOT passed'],
  ].forEach(([hasPreviousConfig, description]) => {

    test(description as string, async () => {

      CommandRunner.prototype.runShellCmd =
        jest.fn().mockResolvedValue(
          hasPreviousConfig ? 'git@dummyUrlHere.git' : 'yo! source_control is not found');

      await new LinkConfigGit().run();

      expect(CommandRunner.prototype.runShellCmd).toHaveBeenCalledWith(
        'styra',
        hasPreviousConfig ? expect.arrayContaining(['--force']) : expect.not.arrayContaining(['--force']),
        expect.anything()
      );
    });
  });

  [
    ['branch', 'my-branch', 'Enter Git branch'],
    ['tag', 'my-tag', 'Enter Git tag'],
    ['commit', 'my-hash', 'Enter Git commit hash']
  ].forEach(([syncStyle, syncValue, prompt]) => {

    test(`correct params are passed for ${syncStyle.toUpperCase()} sync style`, async () => {
      MultiStepInput.prototype.showQuickPick = quickPickMock({syncStyle});

      await new LinkConfigGit().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining([`--${syncStyle}`, syncValue]),
        expect.anything()
      );
    });

    test(`correct prompts are invoked for ${syncStyle.toUpperCase()} sync style`, async () => {
      MultiStepInput.prototype.showQuickPick = quickPickMock({syncStyle});

      await new LinkConfigGit().run();

      expect(MultiStepInput.prototype.showInputBox).toHaveBeenCalledWith(
        expect.objectContaining({prompt})
      );
    });
  });

  [
    [true, 'TLS', 'https://my.url.git',
      [
        'Enter Git user name',
        `Enter Git access token or password ${footnoteMsg}`
      ]],
    [false, 'SSL', 'git@my.url.git',
      [
        `Enter SSH private key passphrase ${footnoteMsg}`,
        `Enter SSH private key file path ${footnoteMsg}`
      ]],
  ].forEach(([useTLS, protocol, url, prompts]) => {
    test(`correct params are passed for ${protocol} protocol`, async () => {
      MultiStepInput.prototype.showInputBox = inputBoxMock({useTLS: useTLS as boolean});

      await new LinkConfigGit().run();

      expect(runnerMock).toHaveBeenCalledWith(
        'styra',
        expect.arrayContaining(useTLS ? [url, '--username', 'my-username'] : [url, '--key-file', 'my key file path']),
        expect.objectContaining({stdinData: useTLS ? 'my token' : 'my key passphrase'})
      );
    });

    test(`correct prompts are invoked for ${protocol} protocol`, async () => {
      MultiStepInput.prototype.showInputBox = inputBoxMock({useTLS: useTLS as boolean});

      await new LinkConfigGit().run();
      (prompts as string[]).forEach((prompt) =>
        expect(MultiStepInput.prototype.showInputBox).toHaveBeenCalledWith(
          expect.objectContaining({prompt})
        )
      );
    });
  });

  // The `_inputMock` robustly makes tests independent of the order of prompts.
  // It handles both showQuickPick (which uses `placeholder`) and showInputBox (which uses `prompt`).
  // When reusing this, you should always have `isInputBox` to distinguish showQuickPick/showInputBox.
  // Use `InputMockOptions` when multiple custom parameters needed for the test class;
  // if only zero or one additional params needed, model after link-init.test instead.

  type InputMockOptions = {
    useTLS?: boolean;
    overwrite?: boolean;
    syncStyle?: string;
  }

  const inputBoxMock = (options?: InputMockOptions) =>
    _inputMock(true, {useTLS: true, ...options});
  const quickPickMock = (options?: InputMockOptions) =>
    _inputMock(false, {overwrite: true, syncStyle: 'branch', ...options});

  const _inputMock = (isInputBox: boolean, options: InputMockOptions = {useTLS: false, overwrite: true, syncStyle: 'any'}) =>
    jest.fn().mockImplementation(
      ({prompt, placeholder}: { prompt: string, placeholder: string }) => {
        let result: string;
        const target = (isInputBox ? prompt : placeholder).replace(/\s*\(.*\)/, ''); // ignore trailing parenthetical, if any
        switch (target) {
          case 'Enter remote Git URL':
            result = options.useTLS ? 'https://my.url.git' : 'git@my.url.git';
            break;
          case 'Enter Git user name':
            result = 'my-username';
            break;
          case 'Enter Git access token or password':
            result = 'my token';
            break;
          case 'Enter SSH private key file path':
            result = 'my key file path';
            break;
          case 'Enter SSH private key passphrase':
            result = 'my key passphrase';
            break;
          case 'Enter Git branch':
            result = 'my-branch';
            break;
          case 'Enter Git tag':
            result = 'my-tag';
            break;
          case 'Enter Git commit hash':
            result = 'my-hash';
            break;
          case 'Do you want to overwrite this configuration?':
            result = options.overwrite ? 'yes' : 'no';
            break;
          case 'How would you like to sync your policies?':
            result = options.syncStyle ?? '';
            break;
          default:
            result = 'UNKNOWN'; // should never happen
        }
        return isInputBox ? result : {label: result};
      });
});
