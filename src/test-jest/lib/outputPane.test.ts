
import { info, outputChannel } from '../../lib/outputPane';

describe('outputPane', () => {

  test('info outputs string as if with a trailing newline', () => {
    const spyAppend = jest.spyOn(outputChannel, 'append');
    const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');
    const target = 'abc\n';
    info(target);
    expect(spyAppend).toHaveBeenCalledWith(target);
    expect(spyAppendLine).not.toHaveBeenCalled();
  });

  test('info outputs string with added newline if absent', () => {
    const spyAppend = jest.spyOn(outputChannel, 'append');
    const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');
    const target = 'abc';
    info(target);
    expect(spyAppend).not.toHaveBeenCalled();
    expect(spyAppendLine).toHaveBeenCalledWith(target);
  });

  test('info outputs string consisting of just a newline', () => {
    const spyAppend = jest.spyOn(outputChannel, 'append');
    const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');
    const target = '\n';
    info(target);
    expect(spyAppend).toHaveBeenCalledWith(target);
    expect(spyAppendLine).not.toHaveBeenCalledWith();
  });

});