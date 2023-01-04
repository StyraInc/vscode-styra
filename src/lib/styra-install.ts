import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as fse from "fs-extra";
import { default as fetch } from "node-fetch";
import moveFile = require("move-file");
import { sync as commandExistsSync } from "command-exists";

// export const STYRA_CLI_CMD = 'styra2'; // TODO: for testing; do not commit!
export const STYRA_CLI_CMD = 'styra';

export class StyraInstall {

  static isInstalled(): boolean {
    const styraPath = vscode.workspace
      .getConfiguration("styra")
      .get<string>("path");
    const existsOnPath = commandExistsSync(STYRA_CLI_CMD);
    const existsInUserSettings =
      styraPath !== undefined && styraPath !== null && fs.existsSync(styraPath);
    return existsOnPath || existsInUserSettings;
  }

  static async promptForInstall(): Promise<boolean> {
    const selection = await vscode.window.showInformationMessage(
      "Styra CLI is not installed. Would you like to install it now?",
      "Install",
      "Cancel"
    );

    if (selection === "Install") {
      vscode.window.showInformationMessage("Installing Styra CLI. This may take a few minutes...");
      try {
        await this.installStyra();
        vscode.window.showInformationMessage("Styra CLI installed.");
        return true;
      } catch (err) {
        vscode.window.showErrorMessage(`Styra CLI installation failed: ${err}`);
        return false;
      }
    } else {
      console.log("cancelling Styra CLI install");
      return false;
    }
  }

  private static async installStyra(): Promise<void> {
    const targetOS = process.platform;
    const targetArch = process.arch;

    const binaryFile = targetOS === "win32" ? STYRA_CLI_CMD + ".exe" : STYRA_CLI_CMD;
    const exeFile = targetOS === "win32" ? "C:\\Program Files\\styra\\" + binaryFile : "/usr/local/bin/" + binaryFile;
    const tempFileLocation = os.homedir() + "/" + binaryFile;

    const url =
      targetOS === "win32"
        ? `https://docs.styra.com/v1/docs/bin/windows/amd64/styra.exe`
        : targetOS !== "darwin"
          ? `https://docs.styra.com/v1/docs/bin/linux/amd64/styra`
          : targetArch === "arm64"
            ? `https://docs.styra.com/v1/docs/bin/darwin/arm64/styra`
            : `https://docs.styra.com/v1/docs/bin/darwin/amd64/styra`; // otherwise target "x64"
 
    await this.getBinary(url, tempFileLocation);
    // throw new Error('dummy err'); // TODO: do not commit this!
    fs.chmodSync(tempFileLocation, "755");
    moveFile(tempFileLocation, exeFile);
  }

  private static async getBinary(url: string, tempFileLocation: string): Promise<void> {
    // adapted from https://stackoverflow.com/a/69290915
    const response = await fetch(url);
    const writeStream = fse.createWriteStream(tempFileLocation, {
      autoClose: true,
      flags: "w",
    });
    response.body.pipe(writeStream);
    return new Promise((resolve, reject) => {
      writeStream.on("error", reject);
      writeStream.on("finish", resolve);
    });
  }
}
