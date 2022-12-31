import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as fse from "fs-extra";
import { default as fetch } from "node-fetch";
import moveFile = require("move-file");

export class StyraInstall {
  static async promptForInstall(): Promise<void> {
    const selection = await vscode.window.showInformationMessage(
      "Styra CLI is not installed. Would you like to install it now?",
      "Install",
      "Cancel"
    );

    if (selection === "Install") {
      console.log("installStyra START");
      await this.installStyra();
      console.log("installStyra DONE");
    } else {
      console.log("cancelling Styra CLI install");
    }
  }

  static async installStyra(): Promise<void> {
    vscode.window.showInformationMessage(
      "Installing Styra CLI. This may take a few minutes..."
    );

    const targetOS = process.platform;
    // TODO: add arm architecture
    const url =
      targetOS === "win32"
        ? `https://docs.styra.com/v1/docs/bin/windows/amd64/styra.exe`
        : targetOS === "darwin"
        ? `https://docs.styra.com/v1/docs/bin/darwin/amd64/styra`
        : `https://docs.styra.com/v1/docs/bin/linux/amd64/styra`;
    const exeFile = targetOS === "win32" ? "C:\\Program Files\\styra\\styra.exe" : "/usr/local/bin/styra";
    // const exeFile = targetOS === "win32" ? "C:\\Program Files\\styra\\styra.exe" : "/Users/msorens/styra-test"; // TODO: do not commit this!
    const binaryFile = targetOS === "win32" ? "styra.exe" : "styra";
    const tempFileLocation = os.homedir() + "/" + binaryFile;

    try {
      await this.getBinary(url, tempFileLocation);
      fs.chmodSync(tempFileLocation, "755");
      moveFile(tempFileLocation, exeFile);
      vscode.window.showInformationMessage("Styra CLI installed.");
    } catch (err) {
      vscode.window.showErrorMessage(`Styra CLI installation failed: ${err}`);
    }
  }

  static async getBinary(url: string, tempFileLocation: string): Promise<void> {
    // adapted from https://stackoverflow.com/a/69290915
    const response = await fetch(url);
    console.log(`starting write ${tempFileLocation}`);
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
