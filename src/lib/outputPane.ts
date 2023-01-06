import * as vscode from 'vscode';

export const outputChannel = vscode.window.createOutputChannel('Styra');

export function info(msg: string): void {
  outputChannel.appendLine(msg);
}

export function infoFromUserAction(msg: string): void {
  info(`[USER]: ${msg}`);
}

export function teeInfo(msg: string): void {
  info(msg);
  vscode.window.showInformationMessage(msg);
}

export function teeWarning(msg: string): void {
  info(`WARNING: ${msg}`);
  vscode.window.showWarningMessage(msg);
}

export function teeError(msg: string): void {
  info(`ERROR: ${msg}`);
  vscode.window.showErrorMessage(msg);
}
