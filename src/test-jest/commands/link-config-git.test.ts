/* eslint-disable @typescript-eslint/no-explicit-any */

import * as utility from '../../commands/utility';
import {CommandRunner} from '../../lib/command-runner';
import {LinkConfigGit} from '../../commands/link-config-git';
import {MultiStepInput} from '../../external/multi-step-input';
import {OutputPaneSpy} from '../utility';

jest.mock('../../commands/utility');

describe('LinkConfigGit', () => {

  const spy = new OutputPaneSpy();

  beforeEach(() => {
    jest.resetModules();
    // almost all tests want checkStartup to succeed
    (utility.checkStartup as unknown as jest.MockInstance<any, any>).mockResolvedValue(true);
  });

  [
    [true, 'CONTINUES'],
    [false, 'ABORTS'],
  ].forEach(([succeeds, description]) => {

    test(`command ${description} when checkStartup returns ${succeeds}`, async () => {
      (utility.checkStartup as unknown as jest.MockInstance<any, any>).mockResolvedValue(succeeds);
      const runnerQuietMock = jest.fn().mockResolvedValue('git@dummyUrlHere.git');
      CommandRunner.prototype.runStyraCmdQuietly = runnerQuietMock;
      MultiStepInput.prototype.showQuickPick = jest.fn().mockResolvedValue(({label: 'no'}));

      await new LinkConfigGit().run();

      expect(runnerQuietMock.mock.calls.length).toBe(succeeds ? 1 : 0); // reached the check-git step or not
      if (succeeds) {
        expect(spy.content).toMatch(/Styra Link Config Git terminated/);
      }
    });
  });

  test('command TERMINATES when previous git config present and user chooses NOT to overwrite', async () => {
    const runnerMock = commandRunnerMock();
    MultiStepInput.prototype.showQuickPick = jest.fn().mockResolvedValue({label: 'no'});

    await new LinkConfigGit().run();

    expect(runnerMock.mock.calls.length).toBe(0);
    expect(spy.content).toMatch(/Styra Link Config Git terminated/);
  });

  test('command COMPLETES when previous git config present and user chooses TO overwrite', async () => {
    const runnerMock = commandRunnerMock();
    MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockResolvedValueOnce({label: 'yes'}) // prompt on overwriting
      .mockResolvedValue({label: 'do not care'}); // any further prompts
    MultiStepInput.prototype.showInputBox = jest.fn().mockResolvedValue('do not care');

    await new LinkConfigGit().run();

    expect(runnerMock.mock.calls.length).toBe(1);
    expect(spy.content).toMatch(/Styra Link Config Git completed/);
  });

  test('nominally makes one reported call to runStyraCmd and one internal call to runStyraCmdQuietly', async () => {
    const runnerMock = jest.fn();
    CommandRunner.prototype.runStyraCmd = runnerMock;
    const runnerQuietMock = jest.fn().mockResolvedValue('yo! source_control is not found');
    CommandRunner.prototype.runStyraCmdQuietly = runnerQuietMock;

    MultiStepInput.prototype.showQuickPick = jest.fn().mockResolvedValue({label: 'do not care'});
    MultiStepInput.prototype.showInputBox = jest.fn().mockResolvedValue('do not care');

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
    const runnerMock = jest.fn();
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
