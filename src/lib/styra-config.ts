import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import { CommandRunner } from './command-runner';
import { STYRA_CLI_CMD } from './styra-install';
import { info, infoFromUserAction, teeError } from './outputPane';

export type ConfigData = {
  url: string;
  token: string;
};

const CONFIG_FILE_PATH = `${os.homedir}/.styra/config`;

export class StyraConfig {
  
  static async read(): Promise<ConfigData> {
    const configData = <ConfigData>{};
    return await fs.promises.readFile(CONFIG_FILE_PATH, 'utf8').then((data) => {
      data.split(/\r?\n/).forEach((line) => {
        const { key, value } = line.match(/(?<key>\w+):\s*(?<value>.+)/)?.groups ?? {};
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

  static async configure(): Promise<boolean> {
    const runner = new CommandRunner();

    if (fs.existsSync(CONFIG_FILE_PATH)) {
      info(`Using existing Styra CLI configuration: ${CONFIG_FILE_PATH}`);
    } else {
      const dasURL = await vscode.window.showInputBox({
        title: 'Enter Styra DAS URL',
      });
      if (!dasURL || !dasURL.trim()) {
        infoFromUserAction('Configuration cancelled due to no input');
        return false;
      }
      const token = await vscode.window.showInputBox({
        title: 'Enter Styra DAS API token',
      });
      if (!token || !token.trim()) {
        infoFromUserAction('Configuration cancelled due to no input');
        return false;
      }
      info('Configuring Styra CLI...');
      try {
        await runner.run(STYRA_CLI_CMD, // no output upon success
          ['configure', '--url', dasURL, '--access-token', token]);
        vscode.window.showInformationMessage('Styra CLI configured.');
        info('Configuration complete');
      } catch (err) {
        // invalid URL or TOKEN will trigger this
        teeError(`Configuration failed: ${err}`);
        return false;
      }
    }
    return true;
  }
}
