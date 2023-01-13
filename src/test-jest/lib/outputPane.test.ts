import * as vscode from 'vscode';
import { info, infoNewCmd, outputChannel } from '../../lib/outputPane';

jest.mock('vscode');

describe('outputPane', () => {

  const spyAppend = jest.spyOn(outputChannel, 'append');
  const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');

  [
    ['abc\n', 'string terminated with a newline'],
    ['\n', 'string with just a newline'],
  ].forEach(([input, description]) => {
    test(`info outputs ${description} as is`, () => {
      info(input);
      expect(spyAppend).toHaveBeenCalledWith(input);
      expect(spyAppendLine).not.toHaveBeenCalled();
    });
  });

  [
    ['abc', 'string NOT terminated with a newline'],
    ['', 'empty string'],
  ].forEach(([input, description]) => {
    test(`info adds a newline for ${description}`, () => {
      info(input);
      expect(spyAppend).not.toHaveBeenCalled();
      expect(spyAppendLine).toHaveBeenCalledWith(input);
    });
  });


  test('infoNewCmd starts with a blank line and prepends "Running Command" on the command name', () => {
    infoNewCmd('my command');
    expect(spyAppendLine).nthCalledWith(1, '');
    expect(spyAppendLine).nthCalledWith(3, 'Running Command: my command');
    // expect(vscode.window.showInformationMessage).toHaveBeenCalled();
    // expect((vscode.window.showInformationMessage as jest.Mock<any, any>).mock.calls.length).toBe(1);
    // expect((vscode.window.showInformationMessage as jest.Mock<any, any>).mock.results).toBe('foo')
  });

});
