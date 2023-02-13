import * as utility from '../../lib/utility';
jest.mock('../../lib/utility');
import {Executor} from '../../commands/executor';
import {ICommand, ReturnValue} from '../../lib/types';
import {outputChannel} from '../../lib/outputPane';
import {OutputPaneSpy} from '../utility';

class MockCompletedCommand implements ICommand {
  run = () => Promise.resolve(ReturnValue.Completed);
  title = 'MockCommand'
}

class MockTerminatedCommand implements ICommand {
  run = () => Promise.resolve(ReturnValue.Terminated);
  title = 'MockCommand'
}

class MockFailedCommand implements ICommand {
  run = () => Promise.reject('threw an error');
  title = 'MockCommand'
}

describe('Executor', () => {

  const spy = new OutputPaneSpy();
  const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');

  [
    [true, 'CONTINUES'],
    [false, 'ABORTS'],
  ].forEach(([succeeds, description]) => {

    test(`command ${description} when checkStartup returns ${succeeds}`, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (utility.checkStartup as unknown as jest.MockInstance<any, any>).mockResolvedValue(succeeds);

      await Executor.run(new MockCompletedCommand());

      if (succeeds) {
        expect(spyAppendLine).toHaveBeenCalled();
        expect(spy.content).toMatch(/Running Command: MockCommand/);
      } else {
        expect(spyAppendLine).not.toHaveBeenCalled();
      }
    });
  });

  [
    {description: 'command completes', command: new MockCompletedCommand(), regex: /====> MockCommand completed/},
    {description: 'command is terminated by user', command: new MockTerminatedCommand(), regex: /\[USER\]: MockCommand terminated/},
    {description: 'command fails', command: new MockFailedCommand(), regex: /====> MockCommand failed/},
  ].forEach(({description, command, regex}) => {
    test(`reports correct info to user when ${description}`, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (utility.checkStartup as unknown as jest.MockInstance<any, any>).mockResolvedValue(true);

      await Executor.run(command);

      expect(spy.content).toMatch(regex);
    });
  });

});
