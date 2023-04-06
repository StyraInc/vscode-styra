import {IDE} from '../../lib/vscode-api';
import {info, infoDebug, outputChannel} from '../../lib/output-pane';
import {mockVSCodeSettings} from '../utility';

describe('outputPane', () => {

  const spyAppend = jest.spyOn(outputChannel, 'append');
  const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');
  IDE.getConfigValue = mockVSCodeSettings();

  describe('info', () => {
    [
      ['abc\n', 'string terminated with a newline'],
      ['\n', 'string with just a newline'],
    ].forEach(([input, description]) => {
      test(`outputs ${description} as is`, () => {
        info(input);
        expect(spyAppend).toHaveBeenCalledWith(input);
        expect(spyAppendLine).not.toHaveBeenCalled();
      });
    });

    [
      ['abc', 'string NOT terminated with a newline'],
      ['', 'empty string'],
    ].forEach(([input, description]) => {
      test(`adds a newline for ${description}`, () => {
        info(input);
        expect(spyAppend).not.toHaveBeenCalled();
        expect(spyAppendLine).toHaveBeenCalledWith(input);
      });
    });
  });

  describe('infoDebug', () => {

    const maxLen = 20;

    beforeEach(() => {
      IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: true});
    });

    test('emits debug prefix', () => {
      infoDebug('abcde');
      expect(spyAppendLine).toHaveBeenCalledWith(expect.stringContaining('[DEBUG]: abcde'));
    });

    test('emits when debug flag is enabled', () => {
      infoDebug('abcde');
      expect(spyAppendLine).toHaveBeenCalledWith(expect.stringContaining('abcde'));
    });

    test('does NOT emit when debug flag is disabled', () => {
      IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: false});
      infoDebug('abcde');
      expect(spyAppendLine).not.toHaveBeenCalled();
    });

    [
      ['short string', maxLen / 2],
      ['max len string', maxLen],
    ].forEach(([description, strlen]) => {
      test(`when max len is ${maxLen} then ${description} of length ${strlen} outputs full string`, () => {
        IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: true, diagnosticLimit: maxLen});
        const input = 'X'.repeat(strlen as number);
        infoDebug(input);
        expect(spyAppendLine).toHaveBeenCalledWith(expect.stringContaining(input));
      });
    });

    [
      ['just slightly too long string', maxLen + 1],
      ['really long string', maxLen * 5],
    ].forEach(([description, strlen]) => {
      test(`when max len is ${maxLen} then ${description} of length ${strlen} outputs truncated string`, () => {
        IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: true, diagnosticLimit: maxLen});
        const input = 'X'.repeat(strlen as number);
        infoDebug(input);
        expect(spyAppendLine).toHaveBeenCalledWith(expect.stringContaining(input.substring(0, maxLen) + '...'));
      });

      test(`when max len is UNDEFINED then ${description} of length ${strlen} outputs full string`, () => {
        IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: true});
        const input = 'X'.repeat(strlen as number);
        infoDebug(input);
        expect(spyAppendLine).toHaveBeenCalledWith(expect.stringContaining(input));
      });

      test(`when max len is -1 then ${description} of length ${strlen} outputs full string`, () => {
        IDE.getConfigValue = mockVSCodeSettings({diagnosticOutput: true, diagnosticLimit: -1});
        const input = 'X'.repeat(strlen as number);
        infoDebug(input);
        expect(spyAppendLine).toHaveBeenCalledWith(expect.stringContaining(input));
      });
    });
  });
});
