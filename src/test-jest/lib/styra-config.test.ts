import * as fs from 'fs';
jest.mock('fs');
import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {mockType, OutputPaneSpy} from '../utility';
import {MultiStepInput} from '../../external/multi-step-input';
import {StyraConfig} from '../../lib/styra-config';

describe('StyraConfig', () => {

  describe('checkCliConfiguration', () => {
    const spy = new OutputPaneSpy();
    MultiStepInput.prototype.showInputBox = jest.fn();

    test('returns true when already configured', async () => {
      mockType(fs.existsSync).mockReturnValue(true);

      expect(await StyraConfig.checkCliConfiguration()).toBe(true);

      expect(spy.content).toMatch(/using existing/i);
    });

    test('returns true when NOT configured and HAS tenant and config succeeds', async () => {
      mockType(fs.existsSync).mockReturnValue(false);
      MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockResolvedValueOnce({label: 'yes'}); // have DAS tenant?
      CommandRunner.prototype.runStyraCmd = jest.fn();

      expect(await StyraConfig.checkCliConfiguration()).toBe(true);

      expect(spy.content).toMatch(/not configured/i);
      expect(spy.content).toMatch(/configuring/i);
      expect(spy.content).toMatch(/configuration complete/i);
    });

    test('returns false and reports failure when NOT configured and HAS tenant but config fails', async () => {
      mockType(fs.existsSync).mockReturnValue(false);
      MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockResolvedValueOnce({label: 'yes'}); // have DAS tenant?
      CommandRunner.prototype.runStyraCmd = jest.fn().mockRejectedValue(new Error('foo'));

      expect(await StyraConfig.checkCliConfiguration()).toBe(false);

      expect(spy.content).toMatch(/not configured/i);
      expect(spy.content).toMatch(/configuring/i);
      expect(spy.content).toMatch(/configuration failed/i);
    });

    test('returns false when NOT configured and does NOT have tenant and user cancels', async () => {
      mockType(fs.existsSync).mockReturnValue(false);
      MultiStepInput.prototype.showQuickPick = jest.fn()
        .mockResolvedValueOnce({label: 'no'}) // have DAS tenant?
        .mockResolvedValueOnce({label: 'cancel'}); // go to styra.com?
      CommandRunner.prototype.runStyraCmd = jest.fn();
      IDE.openUrl = jest.fn();

      expect(await StyraConfig.checkCliConfiguration()).toBe(false);

      expect(IDE.openUrl).not.toHaveBeenCalled();
      expect(spy.content).toMatch(/not configured/i);
      expect(spy.content).not.toMatch(/configuring/i);
    });

    test('returns false when NOT configured and does NOT have tenant and user goes to styra.com', async () => {
      mockType(fs.existsSync).mockReturnValue(false);
      MultiStepInput.prototype.showQuickPick = jest.fn()
        .mockResolvedValueOnce({label: 'no'}) // have DAS tenant?
        .mockResolvedValueOnce({label: 'OK'}); // go to styra.com?
      CommandRunner.prototype.runStyraCmd = jest.fn();
      IDE.openUrl = jest.fn();

      expect(await StyraConfig.checkCliConfiguration()).toBe(false);

      expect(IDE.openUrl).toHaveBeenCalled();
      expect(spy.content).toMatch(/not configured/i);
      expect(spy.content).not.toMatch(/configuring/i);
    });

  });
});
