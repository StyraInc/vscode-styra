// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { existsSync } from "fs";
import * as https from "https";
import * as fs from "fs";
import * as os from "os";
import * as fse from "fs-extra";
import { default as fetch, Request, RequestInit, Response } from "node-fetch";
const commandExistsSync = require("command-exists").sync;
const moveFile = require("move-file");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-styra" is now active!');

  context.subscriptions.push(
    vscode.commands.registerCommand("styra.log.replay", () => {
      runLogReplay();
    })
  );
}

async function runLogReplay() {
  console.log("this is a call to the logReplay function");

  const stryaPath = vscode.workspace
    .getConfiguration("styra")
    .get<string>("path");
  const existsOnPath = commandExistsSync("styra");
  const existsInUserSettings =
    stryaPath !== undefined && stryaPath !== null && existsSync(stryaPath);

  // if the Styra CLI is not installed, prompt the user to install it
  if (!(existsOnPath || existsInUserSettings)) {
    console.log("Styra CLI is is not installed");
    promptForInstall();
    return;
  } else {
    console.log("Styra CLI is installed");
  }

  const dasURL = vscode.workspace.getConfiguration("styra").get<string>("url");
  const token = vscode.workspace.getConfiguration("styra").get<string>("token");
  const request = new Request(`${dasURL}/v1/systems?compact=true`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const response = await fetch(request);
  response.json().then((json) => {
    console.log(json.result);
    const systems = json.result;
    const systemNames = systems.map((system: any) => system.name);
    const selected = vscode.window
      .showQuickPick(systemNames)
      .then((systemName) => {
        if (systemName === undefined) {
          return;
        } else {
          runLogReplayForSystem(systemName);
        }
      });
  });
}

function runLogReplayForSystem(systemName: string) {
  console.log(`running log replay for system: ${systemName}`);
}

function promptForInstall() {
  vscode.window
    .showInformationMessage(
      "Styra CLI is not installed. Would you like to install it now?",
      "Install",
      "Cancel"
    )
    .then((selection) => {
      if (selection === "Install") {
        console.log("installing Styra CLI");
        installStyra();
      } else {
        console.log("cancelling Styra CLI install");
      }
    });
}

async function installStyra() {
  vscode.window.showInformationMessage(
    "Installing Styra CLI. This may take a few minutes."
  );

  const targetOS = process.platform;
  // Setup url based on the targetOS
  const url =
    targetOS === "win32"
      ? `https://docs.styra.com/v1/docs/bin/windows/amd64/styra.exe`
      : targetOS === "darwin"
      ? `https://docs.styra.com/v1/docs/bin/darwin/amd64/styra`
      : `https://docs.styra.com/v1/docs/bin/linux/amd64/styra`;
  const binaryFile =
    targetOS === "win32"
      ? "styra.exe"
      : targetOS === "darwin"
      ? "styra"
      : "styra";
  const tempFileLocation = os.homedir() + "/" + binaryFile;
  const response = await fetch(url);
  const writeStream = fse.createWriteStream(tempFileLocation);
  response.body.pipe(writeStream);
  writeStream.on("finish", () => {
    console.log("Styra CLI installed");
    fs.chmodSync(tempFileLocation, "755");
    targetOS === "win32"
      ? moveFile(tempFileLocation, "C:\\Program Files\\styra\\styra.exe")
      : targetOS === "darwin"
      ? moveFile(tempFileLocation, "/usr/local/bin/styra")
      : moveFile(tempFileLocation, "/usr/local/bin/styra");
    vscode.window.showInformationMessage("Styra CLI installed.");
  });
  writeStream.on("error", (error) => {
    console.log("error writing to file");
    console.log(error);
  });
}
