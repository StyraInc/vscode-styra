/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fs from 'fs';
jest.mock('fs');
import {CommandRunner} from '../../lib/command-runner';
import {MultiStepInput} from '../../external/multi-step-input';
import {outputChannel} from '../../lib/outputPane';
import {StyraConfig} from '../../lib/styra-config';

describe('StyraConfig', () => {

  const spyAppendLine = jest.spyOn(outputChannel, 'appendLine');
  MultiStepInput.prototype.showInputBox = jest.fn();

  test('checkCliConfiguration returns true when already configured', async () => {
    (fs.existsSync as unknown as jest.MockInstance<any, any>).mockReturnValue(true);

    expect(await StyraConfig.checkCliConfiguration()).toBe(true);

    const [output] = spyAppendLine.mock.calls[0];
    expect(output).toMatch(/using existing/i);
  });

  test('checkCliConfiguration returns true when NOT configured and config succeeds', async () => {
    (fs.existsSync as unknown as jest.MockInstance<any, any>).mockReturnValue(false);
    CommandRunner.prototype.runStyraCmd = jest.fn().mockReturnValue('');

    expect(await StyraConfig.checkCliConfiguration()).toBe(true);

    const output = spyAppendLine.mock.calls.join(',');
    expect(output).toMatch(/not configured/);
    expect(output).toMatch(/complete/);
  });

  test('checkCliConfiguration returns false and reports failure when NOT configured but config fails', async () => {
    (fs.existsSync as unknown as jest.MockInstance<any, any>).mockReturnValue(false);
    CommandRunner.prototype.runStyraCmd = jest.fn().mockRejectedValue(new Error('foo'));

    expect(await StyraConfig.checkCliConfiguration()).toBe(false);

    const output = spyAppendLine.mock.calls.join(',');
    expect(output).toMatch(/not configured/);
    expect(output).toMatch(/failed/i);
  });

});
