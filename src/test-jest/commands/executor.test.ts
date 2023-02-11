import * as utility from '../../lib/utility';
jest.mock('../../lib/utility');
import {CommandRunner} from '../../lib/command-runner';
import {Executor} from '../../commands/executor';
import {LinkConfigGit} from '../../commands/link-config-git';
import {MultiStepInput} from '../../external/multi-step-input';
import {OutputPaneSpy} from '../utility';

describe('Executor', () => {

  const spy = new OutputPaneSpy();

  beforeEach(() => {
    jest.resetModules();
  });

  [
    [true, 'CONTINUES'],
    [false, 'ABORTS'],
  ].forEach(([succeeds, description]) => {

    test(`command ${description} when checkStartup returns ${succeeds}`, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (utility.checkStartup as unknown as jest.MockInstance<any, any>).mockResolvedValue(succeeds);
      const runnerQuietMock = jest.fn().mockResolvedValue('git@dummyUrlHere.git');
      CommandRunner.prototype.runStyraCmdQuietly = runnerQuietMock;
      MultiStepInput.prototype.showQuickPick = jest.fn().mockResolvedValue(({label: 'no'}));

      await Executor.run(new LinkConfigGit());

      expect(runnerQuietMock.mock.calls.length).toBe(succeeds ? 1 : 0); // reached the check-git step or not
      if (succeeds) {
        expect(spy.content).toMatch(/Styra Link Config Git terminated/);
      }
    });
  });

});
