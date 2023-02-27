import {info, outputChannel} from '../../lib/output-pane';

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

});
