import * as vscode from "vscode";
import { LogReplay } from "./commands/log-replay";

const outputChannel = vscode.window.createOutputChannel("Styra");

export function log(msg: string): void {
  outputChannel.appendLine(msg);
}

export function logUser(msg: string): void {
  outputChannel.appendLine(`[USER]: ${msg}`);
}

export function teeInfo(msg: string): void {
  log(msg);
  vscode.window.showInformationMessage(msg);
}

export function teeWarning(msg: string): void {
  log(`WARNING: ${msg}`);
  vscode.window.showWarningMessage(msg);
}

export function teeError(msg: string): void {
  log(`ERROR: ${msg}`);
  vscode.window.showErrorMessage(msg);
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {

  outputChannel.show(true);
  log('Styra extension active!');

  context.subscriptions.push(
    vscode.commands.registerCommand("styra.log.replay", () => {
      new LogReplay().runLogReplay();
    })
  );
}

