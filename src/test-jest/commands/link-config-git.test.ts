import {CommandRunner} from '../../lib/command-runner';
import {LinkConfigGit} from '../../commands/link-config-git';
import {MultiStepInput} from '../../external/multi-step-input';
import {ReturnValue} from '../../lib/types';

describe('LinkConfigGit', () => {

  // TODO: test just for params under test!

  beforeEach(() => {

    // responds to query to fetch existing git url, if any
    CommandRunner.prototype.runStyraCmdQuietly =
      jest.fn().mockResolvedValue('git@dummyUrlHere.git');

    // responds to primary styra link command under test
    CommandRunner.prototype.runStyraCmd = jest.fn().mockResolvedValue('any');

    // provide responses to user inputs
    MultiStepInput.prototype.showQuickPick = quickPickMock();
    MultiStepInput.prototype.showInputBox = inputBoxMock();
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

  test('nominally makes one reported call to runStyraCmd and one internal call to runStyraCmdQuietly', async () => {
    const runnerQuietMock = jest.fn().mockResolvedValue('yo! source_control is not found');
    CommandRunner.prototype.runStyraCmdQuietly = runnerQuietMock;

    const runnerMock = jest.fn().mockResolvedValue('some info here');
    CommandRunner.prototype.runStyraCmd = runnerMock;

    await new LinkConfigGit().run();

    expect(runnerQuietMock.mock.calls.length).toBe(1);
    expect(runnerMock.mock.calls.length).toBe(1);
  });

  [
    [true, 'WITH previous git config, force param IS passed'],
    [false, 'WITHOUT previous git config, force param is NOT passed'],
  ].forEach(([hasPreviousConfig, description]) => {

    test(description as string, async () => {

      CommandRunner.prototype.runStyraCmdQuietly =
        jest.fn().mockResolvedValue(
          hasPreviousConfig ? 'git@dummyUrlHere.git' : 'yo! source_control is not found');

      MultiStepInput.prototype.showInputBox = inputBoxMock({useTLS: false});

      await new LinkConfigGit().run();

      expect(CommandRunner.prototype.runStyraCmd).toHaveBeenCalledWith(
        ['link', 'config', 'git', 'git@my.url.git', '--branch', 'my-branch',
          hasPreviousConfig ? '--force' : '',
          '--password-stdin', '--key-file', 'my key file path'],
        {stdinData: 'my key passphrase'});
    });
  });

  [
    ['branch', 'my-branch'],
    ['tag', 'my-tag'],
    ['commit', 'my-hash']
  ].forEach(([syncStyle, syncValue]) => {

    test(`correct prompt is used for ${syncStyle.toUpperCase()} sync style`, async () => {
      MultiStepInput.prototype.showQuickPick = quickPickMock({syncStyle});
      MultiStepInput.prototype.showInputBox = inputBoxMock({useTLS: false});

      await new LinkConfigGit().run();

      expect(CommandRunner.prototype.runStyraCmd).toHaveBeenCalledWith(
        ['link', 'config', 'git', 'git@my.url.git', `--${syncStyle}`, syncValue, '--force', '--password-stdin', '--key-file', 'my key file path'],
        {stdinData: 'my key passphrase'});
    });
  });

  [
    [true, 'TLS', 'https://my.url.git'],
    [false, 'SSL', 'git@my.url.git'],
  ].forEach(([useTLS, protocol, url]) => {
    test(`correct params are passed for ${protocol} protocol`, async () => {
      MultiStepInput.prototype.showInputBox = inputBoxMock({useTLS: useTLS as boolean});

      await new LinkConfigGit().run();

      expect(CommandRunner.prototype.runStyraCmd).toHaveBeenCalledWith(
        ['link', 'config', 'git', url, '--branch', 'my-branch', '--force', '--password-stdin',
          useTLS ? '--username' : '--key-file',
          useTLS ? 'my-username' : 'my key file path'],
        {stdinData: useTLS ? 'my token' : 'my key passphrase'});
    });
  });

  // The `_inputMock` robustly makes tests independent of the order of prompts.
  // It handles both showQuickPick (which uses `placeholder`) and showInputBox (which uses `prompt`).
  // When reusing this, you should always have `isInputBox` to distinguish showQuickPick/showInputBox.
  // Use `MockOptions` for any custom parameters needed for the test class.

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
