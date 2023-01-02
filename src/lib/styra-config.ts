import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import { CommandRunner } from "./command-runner";

export type ConfigData = {
  url: string;
  token: string;
};

const CONFIG_FILE_PATH = `${os.homedir}/.styra/config`;
export const STYRA_CLI_CMD = 'styra';

export class StyraConfig {
  
  static async read(): Promise<ConfigData> {
    const configData = <ConfigData>{};
    return await fs.promises.readFile(CONFIG_FILE_PATH, "utf8").then((data) => {
      data.split(/\r?\n/).forEach((line) => {
        const { key, value } = line.match(/(?<key>\w+):\s*(?<value>.+)/)?.groups ?? {};
        if (key === "url") {
          configData.url = value;
        }
        if (key === "token") {
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
      console.log("Styra CLI already configured");
      vscode.window.showInformationMessage(
        `Using existing Styra CLI configuration (${CONFIG_FILE_PATH})`
      );
    } else {
      const dasURL = await vscode.window.showInputBox({
        title: "Enter Styra DAS URL",
      });
      if (!dasURL || !dasURL.trim()) {
        vscode.window.showWarningMessage("Config cancelled due to no input");
        return false;
      }
      const token = await vscode.window.showInputBox({
        title: "Enter Styra DAS API token",
      });
      if (!token || !token.trim()) {
        vscode.window.showWarningMessage("Config cancelled due to no input");
        return false;
      }
      vscode.window.showInformationMessage("Configuring Styra CLI.");
      try {
        await runner.run(STYRA_CLI_CMD, // no output upon success
          ["configure", "--url", dasURL, "--access-token", token]);
        vscode.window.showInformationMessage("Styra CLI configured.");
        console.log("configure complete");
      } catch (err) {
        // invalid URL or TOKEN will trigger this
        vscode.window.showErrorMessage(`Styra CLI configure failed: ${err}`);
        console.log("configure failed!");
        return false;
      }
    }
    return true;
  }
}
