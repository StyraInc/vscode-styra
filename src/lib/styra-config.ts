import * as fs from 'fs';
import * as os from 'os';

import { CommandRunner } from './command-runner';
import { IDE } from './vscode-api';
import { info, infoFromUserAction } from './outputPane';
import { STYRA_CLI_CMD } from './styra-install';

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

  static async checkCliConfiguration(): Promise<boolean> {
    const runner = new CommandRunner();

    if (fs.existsSync(CONFIG_FILE_PATH)) {
      info(`Using existing Styra CLI configuration: ${CONFIG_FILE_PATH}`);
      return true;
    }

    info('Styra CLI is not configured');
    const dasURL = await IDE.showInputBox({
      title: 'Styra CLI Configuration (1/2)',
      placeHolder: 'Base URL to Styra DAS Tenant',
      // prompt: "further details can go here..."
    });
    if (!dasURL || !dasURL.trim()) {
      infoFromUserAction('Configuration cancelled due to no input');
      return false;
    }
    const token = await IDE.showInputBox({
      title: 'Styra CLI Configuration (2/2)',
      placeHolder: 'API token for Styra DAS Tenant',
      // prompt: "further details can go here..."
    });
    if (!token || !token.trim()) {
      infoFromUserAction('Configuration cancelled due to no input');
      return false;
    }
    info('Configuring Styra CLI...');
    try {
      await runner.runShellCmd(
        STYRA_CLI_CMD, // no output upon success
        ['configure', '--url', dasURL, '--access-token', token]
      );
      IDE.showInformationMessage('Styra CLI configured.');
      info('Configuration complete');
    } catch (err) {
      // invalid URL or TOKEN will trigger this
      info('Configuration failed'); // err already displayed so not emitting again here
      return false;
    }
    return true;
  }
}
