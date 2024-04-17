import {Executor} from '../../commands/executor';
import {ICommand, ReturnValue} from '../../lib/types';
import {IDE} from '../../lib/vscode-api';
import {mockType, mockVSCodeSettings, OutputPaneSpy} from '../utility';
import {outputChannel} from '../../lib/output-pane';
import {StyraInstall} from '../../lib/styra-install';

class MockCompletedCommand implements ICommand {
  run = () => Promise.resolve(ReturnValue.Completed);
  title = 'MockCommand';
}

class MockTerminatedCommand implements ICommand {
  run = () => Promise.resolve(ReturnValue.TerminatedByUser);
  title = 'MockCommand';
}

class MockFailedCommand implements ICommand {
  run = () => Promise.reject('threw an error');
  title = 'MockCommand';
}

describe('Executor', () => {

  const spy = new OutputPaneSpy();
  const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');
  Executor.checkStartup = jest.fn();
  IDE.getConfigValue = mockVSCodeSettings();

  beforeEach(() => {
    StyraInstall.styraCmdExists = jest.fn().mockResolvedValue(true);
  });

  [
    [true, 'CONTINUES'],
    [false, 'ABORTS'],
  ].forEach(([succeeds, description]) => {

    test(`command ${description} when checkStartup returns ${succeeds}`, async () => {
      mockType(Executor.checkStartup).mockResolvedValue(succeeds);

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
      mockType(Executor.checkStartup).mockResolvedValue(true);

      await Executor.run(command);

      expect(spy.content).toMatch(regex);
    });
  });

});
