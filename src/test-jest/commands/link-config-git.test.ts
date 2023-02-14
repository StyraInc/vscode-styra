import {CommandRunner} from '../../lib/command-runner';
import {LinkConfigGit} from '../../commands/link-config-git';
import {MultiStepInput} from '../../external/multi-step-input';
import {ReturnValue} from '../../lib/types';

describe('LinkConfigGit', () => {

  beforeEach(() => {
    jest.resetModules();
  });

  test('command TERMINATES when previous git config present and user chooses NOT to overwrite', async () => {
    commandRunnerMock();
    MultiStepInput.prototype.showQuickPick = jest.fn().mockResolvedValue({label: 'no'});

    const result = await new LinkConfigGit().run();

    expect(result).toBe(ReturnValue.TerminatedByUser);
  });

  test('command COMPLETES when previous git config present and user chooses TO overwrite', async () => {
    commandRunnerMock();
    MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockResolvedValueOnce({label: 'yes'}) // prompt on overwriting
      .mockResolvedValue({label: 'any'}); // any further prompts
    MultiStepInput.prototype.showInputBox = jest.fn().mockResolvedValue('any');

    const result = await new LinkConfigGit().run();

    expect(result).toBe(ReturnValue.Completed);
  });

  test('nominally makes one reported call to runStyraCmd and one internal call to runStyraCmdQuietly', async () => {
    const runnerMock = jest.fn().mockResolvedValue('any');
    CommandRunner.prototype.runStyraCmd = runnerMock;
    const runnerQuietMock = jest.fn().mockResolvedValue('yo! source_control is not found');
    CommandRunner.prototype.runStyraCmdQuietly = runnerQuietMock;

    MultiStepInput.prototype.showQuickPick = jest.fn().mockResolvedValue({label: 'any'});
    MultiStepInput.prototype.showInputBox = jest.fn().mockResolvedValue('any');

    await new LinkConfigGit().run();

    expect(runnerQuietMock.mock.calls.length).toBe(1);
    expect(runnerMock.mock.calls.length).toBe(1);
  });

  [
    [true, 'WITH previous git config, force param IS passed'],
    [false, 'WITHOUT previous git config, force param is NOT passed'],
  ].forEach(([hasPreviousConfig, description]) => {

    test(description as string, async () => {
      const runnerMock = commandRunnerMock(hasPreviousConfig as boolean);
      MultiStepInput.prototype.showQuickPick = hasPreviousConfig ?
      // with previous git config, there is an additional question about overwrite to answer
        jest.fn().mockResolvedValueOnce({label: 'yes'})
          .mockResolvedValueOnce({label: 'branch'})
        : jest.fn().mockResolvedValueOnce({label: 'branch'});
      MultiStepInput.prototype.showInputBox = jest.fn()
        .mockImplementation(inputBoxMock(false));

      await new LinkConfigGit().run();

      expect(runnerMock).toHaveBeenCalledWith(
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
      const runnerMock = commandRunnerMock();
      MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockResolvedValueOnce({label: 'yes'})
      .mockResolvedValueOnce({label: syncStyle});
      MultiStepInput.prototype.showInputBox = jest.fn()
      .mockImplementation(inputBoxMock(false));

      await new LinkConfigGit().run();

      expect(runnerMock).toHaveBeenCalledWith(
        ['link', 'config', 'git', 'git@my.url.git', `--${syncStyle}`, syncValue, '--force', '--password-stdin', '--key-file', 'my key file path'],
        {stdinData: 'my key passphrase'});
    });
  });

  [
    [true, 'TLS', 'https://my.url.git'],
    [false, 'SSL', 'git@my.url.git'],
  ].forEach(([useTLS, protocol, url]) => {
    test(`correct params are passed for ${protocol} protocol`, async () => {
      const runnerMock = commandRunnerMock();
      MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockImplementationOnce(() => ({label: 'yes'}))
      .mockImplementationOnce(() => ({label: 'branch'}));
      MultiStepInput.prototype.showInputBox = jest.fn()
      .mockImplementation(inputBoxMock(useTLS as boolean));

      await new LinkConfigGit().run();

      expect(runnerMock).toHaveBeenCalledWith(
        ['link', 'config', 'git', url, '--branch', 'my-branch', '--force', '--password-stdin',
          useTLS ? '--username' : '--key-file',
          useTLS ? 'my-username' : 'my key file path'],
        {stdinData: useTLS ? 'my token' : 'my key passphrase'});
    });
  });

  const commandRunnerMock = (hasPreviousConfig = true) => {
    // responds to query to fetch existing git url, if any
    const runnerQuietMock = jest.fn().mockResolvedValue(
      hasPreviousConfig ? 'git@dummyUrlHere.git' : 'yo! source_control is not found');
    CommandRunner.prototype.runStyraCmdQuietly = runnerQuietMock;
    // responds to primary styra link command
    const runnerMock = jest.fn().mockResolvedValue('some info here');
    CommandRunner.prototype.runStyraCmd = runnerMock;
    return runnerMock;
  };

  // this mock robustly makes tests independent of the order of prompts
  const inputBoxMock = (useTLS: boolean) => ({prompt}: {prompt: string}) => {
    switch (prompt.replace(/ \(.*\)/, '')) { // ignore trailing parenthetical, if any
      case 'Enter remote Git URL':
        return useTLS ? 'https://my.url.git' : 'git@my.url.git';
      case 'Enter Git user name':
        return 'my-username';
      case 'Enter Git access token or password':
        return 'my token';
      case 'Enter SSH private key file path':
        return 'my key file path';
      case 'Enter SSH private key passphrase':
        return 'my key passphrase';
      case 'Enter Git branch':
        return 'my-branch';
      case 'Enter Git tag':
        return 'my-tag';
      case 'Enter Git commit hash':
        return 'my-hash';
      default:
        return 'UNKNOWN'; // should never happen
    }
  };
});
