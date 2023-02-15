import * as fs from 'fs';
import * as fspromises from 'fs/promises';
import {CommandRunner} from '../../lib/command-runner';
import {IDE} from '../../lib/vscode-api';
import {MultiStepInput} from '../../external/multi-step-input';
import {OutputPaneSpy} from '../utility';
import {StyraConfig} from '../../lib/styra-config';

describe('StyraConfig', () => {

  describe('checkCliConfiguration', () => {
    const spy = new OutputPaneSpy();
    MultiStepInput.prototype.showInputBox = jest.fn();

    test('returns true when already configured', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);

      expect(await StyraConfig.checkCliConfiguration()).toBe(true);

      expect(spy.content).toMatch(/using existing/i);
    });

    test('returns true when NOT configured and HAS tenant and config succeeds', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockResolvedValueOnce({label: 'yes'}); // have DAS tenant?
      CommandRunner.prototype.runStyraCmd = jest.fn();

      expect(await StyraConfig.checkCliConfiguration()).toBe(true);

      expect(spy.content).toMatch(/not configured/i);
      expect(spy.content).toMatch(/configuring/i);
      expect(spy.content).toMatch(/configuration complete/i);
    });

    test('returns false and reports failure when NOT configured and HAS tenant but config fails', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      MultiStepInput.prototype.showQuickPick = jest.fn()
      .mockResolvedValueOnce({label: 'yes'}); // have DAS tenant?
      CommandRunner.prototype.runStyraCmd = jest.fn().mockRejectedValue(new Error('foo'));

      expect(await StyraConfig.checkCliConfiguration()).toBe(false);

      expect(spy.content).toMatch(/not configured/i);
      expect(spy.content).toMatch(/configuring/i);
      expect(spy.content).toMatch(/configuration failed/i);
    });

    test('returns false when NOT configured and does NOT have tenant and user cancels', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
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
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
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

  describe('read', () => {

    [
      {description: 'nominal data',
        data: `
        url: https://my.url.com
        token: token_value
        `
      },
      {description: 'extra properties are ignored',
        data: `
        other: foobar
        url: https://my.url.com
        token: token_value
        `
      },
      {description: 'extra lines are ignored',
        data: `
        # ostensibly a comment of sorts
        url: https://my.url.com
        token: token_value
        `
      },
      {description: 'duplicate returns the last occurrence',
        data: `
        url: https://other.url.com
        url: https://my.url.com
        token: token_value
        `
      },
      {description: 'whitespace inside of key is valid',
        data: `
        url: https://my.url.com
        token  : token value
        `
      },
      {description: 'whitespace outside of key is trimmed',
        data: `
        url: https://my.url.com
        token  : token_value
        `
      },
      {description: 'whitespace in value is trimmed',
        data: `
        url: https://my.url.com     
        token: token_value
        `
      },
      {description: 'blank lines are safely ignored',
        data: `

        url: https://my.url.com

        token: token_value

        `
      }

    ].forEach(({description, data}) => {

      test(description, async () => {
        jest.spyOn(fspromises, 'readFile').mockResolvedValue(data);
        const {url, token} = await StyraConfig.read();
        expect(url).toBe('https://my.url.com');
        expect(['token_value', 'token value']).toContain(token);
      });

    });
  });
});
