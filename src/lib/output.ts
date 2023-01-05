import * as vscode from "vscode";

export const outputChannel = vscode.window.createOutputChannel("Styra");

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
