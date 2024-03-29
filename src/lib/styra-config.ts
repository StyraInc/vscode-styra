import * as fs from 'fs';
import * as os from 'os';

import {CommandRunner} from './command-runner';
import {footnoteMsg, info, infoDebug, infoInput, teeError} from './output-pane';
import {generatePickList, shouldResume, StepType, validateNonEmpty} from '../commands/utility';
import {IDE, QuickPickItem} from './vscode-api';
import {MultiStepInput} from '../external/multi-step-input';
import path = require('path');

export class DASConfigData {
  url = '';
  token = '';
}

export class ProjectConfigData {
  projectType = '';
  name = '';
}

const CONFIG_FILE_PATH = '.styra/config';
const DAS_CONFIG_FILE_PATH = `${os.homedir}/${CONFIG_FILE_PATH}`;

interface State {
  hasTenant: QuickPickItem;
  transferToStyra: QuickPickItem;
  token: string;
  url: string;
}

export class StyraConfig {

  static async getProjectConfig(): Promise<ProjectConfigData> {

    const configFile = path.join(IDE.projectDir() ?? '.', CONFIG_FILE_PATH);
    if (fs.existsSync(configFile)) {
      return await StyraConfig.read(configFile, new ProjectConfigData());
    }
    infoDebug(`Project config file (${configFile}) not found`);
    return Promise.resolve({
      name: '',
      projectType: ''
    });
  }

  static async getDASConfig(): Promise<DASConfigData> {
    return await StyraConfig.read(DAS_CONFIG_FILE_PATH, new DASConfigData());
  }

  // TODO: get rid of "any" with appropriate index type
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  static async read(filename: string, configData: any): Promise<any> {
    const fields = Object.keys(configData);

    return await fs.promises.readFile(filename, 'utf8').then((data) => {
      data.split(/\r?\n/).forEach((line) => {
        const {key, value} = line.match(/(?<key>\w+)\s*:\s*(?<value>.*\S)/)?.groups ?? {};
        if (fields.includes(key)) {
          configData[key] = value;
        }
        // silently ignore anything else in the config, valid property or otherwise
      });
      return configData;
    });
  }

  static async checkCliConfiguration(): Promise<boolean> {
    const runner = new CommandRunner();

    if (fs.existsSync(DAS_CONFIG_FILE_PATH)) {
      infoDebug(`Using existing Styra CLI configuration: ${DAS_CONFIG_FILE_PATH}`);
      return true;
    }

    info('Styra CLI is not configured');
    const state = await this.collectInputs();
    if (state.hasTenant.label === 'no') {
      return false; // whether chose to create to get one or not, abort this command
    }
    info('\nConfiguring Styra CLI...');
    try {
      await runner.runStyraCmd( // no output upon success
        ['configure', '--url', state.url, '--access-token', state.token],
        {progressTitle: 'Styra configuration'}
      );
      IDE.showInformationMessage('Styra CLI configured.');
      info('Configuration complete');
    } catch (err) { // invalid URL or TOKEN will typically trigger this
      teeError((err as Error).message);
      info('Configuration failed');
      return false;
    }
    return true;
  }

  private static async collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.pickAlreadyHaveTenant(input, state));
    return state as State;
  }

  private static async pickAlreadyHaveTenant(input: MultiStepInput, state: Partial<State>): Promise<StepType | void> {
    state.hasTenant = await input.showQuickPick({
      ignoreFocusOut: true,
      title: 'Styra CLI Configuration',
      step: 1,
      totalSteps: 3,
      placeholder: 'Do you already have a DAS tenant?',
      items: generatePickList(['yes', 'no']),
      activeItem: state.hasTenant,
      shouldResume,
    });
    return state.hasTenant.label === 'yes'
      ? (input: MultiStepInput) => this.inputURL(input, state)
      : (input: MultiStepInput) => this.pickOkToGetTenant(input, state);
  }

  private static async pickOkToGetTenant(input: MultiStepInput, state: Partial<State>): Promise<StepType | void> {
    state.transferToStyra = await input.showQuickPick({
      ignoreFocusOut: true,
      title: 'Styra CLI Configuration',
      step: 2,
      totalSteps: 2,
      placeholder: 'We will send you to Styra.com to sign-up for a free tenant, OK?',
      items: generatePickList(['OK', 'cancel']),
      activeItem: state.transferToStyra,
      shouldResume,
    });
    if (state.transferToStyra.label === 'OK') {
      IDE.openUrl('https://signup.styra.com/');
    }
  }

  private static async inputURL(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    state.url = await input.showInputBox({
      ignoreFocusOut: true,
      title: 'Styra CLI Configuration',
      step: 2,
      totalSteps: 3,
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
      step: 3,
      totalSteps: 3,
      value: state.token ?? '',
      prompt: `Enter API token for Styra DAS Tenant ${footnoteMsg}`,
      validate: validateNonEmpty,
      shouldResume,
    });
  }

}
