import {CommandNotifier} from '../../lib/command-notifier';
import {outputChannel} from '../../lib/outputPane';

describe('CommandNotifier', () => {

  const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');

  test('infoNewCmd starts with a blank line and prepends "Running Command" on the command name', () => {
    const cmdNotifier = new CommandNotifier('my command');
    cmdNotifier.markStart();
    expect(spyAppendLine).nthCalledWith(1, '');
    expect(spyAppendLine).nthCalledWith(3, 'Running Command: my command');
  });

  test('infoCmdSucceeded', () => {
    const cmdNotifier = new CommandNotifier('my command');
    cmdNotifier.markHappyFinish();
    const [output] = spyAppendLine.mock.calls[0]; // allows testing partial matches
    expect(output).toMatch(/my command/);
    expect(output).toMatch(/complete/);
  });

  test('infoCmdFailed', () => {
    const cmdNotifier = new CommandNotifier('my command');
    cmdNotifier.markSadFinish();
    const [output] = spyAppendLine.mock.calls[0]; // allows testing partial matches
    expect(output).toMatch(/my command/);
    expect(output).toMatch(/failed/);
  });

});
