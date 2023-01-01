import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import { CommandRunner } from "./command-runner";

export type ConfigData = {
  url: string;
  token: string;
};

export const CONFIG_FILE_PATH = `${os.homedir}/.styra/config`;

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

  static async configure(): Promise<void> {
    const runner = new CommandRunner();

    if (fs.existsSync(CONFIG_FILE_PATH)) {
      console.log("Styra CLI already configured");
      vscode.window.showInformationMessage(
        `Using existing Styra CLI configuration (${CONFIG_FILE_PATH})`
      );
    } else {
      const dasURL = await vscode.window.showInputBox({
        title: "Styra DAS URL",
      });
      if (!dasURL || !dasURL.trim()) {
        vscode.window.showWarningMessage("Config cancelled due to no input");
        return;
      }
      const token = await vscode.window.showInputBox({
        title: "Styra DAS API token",
      });
      if (!token || !token.trim()) {
        vscode.window.showWarningMessage("Config cancelled due to no input");
        return;
      }
      console.log("Configuring the Styra CLI");
      vscode.window.showInformationMessage("Configuring Styra CLI.");
      runner.run(
        "styra",
        ["configure", "--url", dasURL, "--access-token", token],
        "",
        (error: string, result: any) => {
          console.log(result);
          vscode.window.showInformationMessage("Styra CLI configured.");
        }
      );
    }
  }
}
