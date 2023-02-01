import * as fs from 'fs';
import * as os from 'os';

import {CommandRunner} from './command-runner';
import {IDE} from './vscode-api';
import {info, infoInput, teeError} from './outputPane';
import {MultiStepInput} from '../external/multi-step-input';
import {shouldResume, StepType, validateNonEmpty} from '../commands/utility';

export type ConfigData = {
  url: string;
  token: string;
};

const CONFIG_FILE_PATH = `${os.homedir}/.styra/config`;

interface State {
  token: string;
  url: string;
}

export class StyraConfig {

  static async read(): Promise<ConfigData> {
    const configData = <ConfigData>{};
    return await fs.promises.readFile(CONFIG_FILE_PATH, 'utf8').then((data) => {
      data.split(/\r?\n/).forEach((line) => {
        const {key, value} = line.match(/(?<key>\w+):\s*(?<value>.+)/)?.groups ?? {};
        if (key === 'url') {
          configData.url = value;
        }
        if (key === 'token') {
          configData.token = value;
        }
        // silently ignore any other properties in the config, valid or not
      });
      return configData;
    });
  }

  static async checkCliConfiguration(): Promise<boolean> {
    const runner = new CommandRunner();

    if (fs.existsSync(CONFIG_FILE_PATH)) {
      info(`Using existing Styra CLI configuration: ${CONFIG_FILE_PATH}`);
      return true;
    }

    info('Styra CLI is not configured');
    const state = await this.collectInputs();
    info('\nConfiguring Styra CLI...');
    try {
      await runner.runStyraCmd( // no output upon success
        ['configure', '--url', state.url, '--access-token', state.token],
        {progressTitle: 'Styra configuration'}
      );
      IDE.showInformationMessage('Styra CLI configured.');
      info('Configuration complete');
    } catch ({message}) { // invalid URL or TOKEN will typically trigger this
      if ((message as string).startsWith('code error')) {
        teeError(message as string);
      } else {
        // err already displayed for runtime errors
      }
      info('Configuration failed');
      return false;
    }
    return true;
  }

  private static async collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.inputURL(input, state));
    return state as State;
  }

  private static async inputURL(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.url = await input.showInputBox({
      ignoreFocusOut: true,
      title: 'Styra CLI Configuration',
      step: 1,
      totalSteps: 2,
      value: state.url ?? '',
      placeholder: 'https://test.YOUR-DOMAIN.com',
      prompt: 'Enter base URL to Styra DAS Tenant',
      validate: validateNonEmpty,
      shouldResume,
    });
    return (input: MultiStepInput) => this.inputToken(input, state);
  }

  private static async inputToken(input: MultiStepInput, state: Partial<State>): Promise<void> {
    infoInput('Obtain a token by going to DAS in your browser, selecting the Workspace, then: Access Control >> API Tokens >> Add API Token');
    state.token = await input.showInputBox({
      ignoreFocusOut: true,
      password: true,
      title: 'Styra CLI Configuration',
      step: 2,
      totalSteps: 2,
      value: state.token ?? '',
      prompt: 'Enter API token for Styra DAS Tenant',
      validate: validateNonEmpty,
      shouldResume,
    });
  }

}
