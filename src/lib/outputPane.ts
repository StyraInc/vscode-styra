import * as vscode from 'vscode';

export const outputChannel = vscode.window.createOutputChannel('Styra');

export function info(msg: string): void {
  if (msg.endsWith('\n') && msg.length > 1) {
    outputChannel.append(msg); // remove superfluous newline
  } else {
    outputChannel.appendLine(msg);
  }
}

export function infoNewCmd(cmd: string): void {
  info('');
  info('------------------------------------------------------');
  // TODO: use https://www.npmjs.com/package/vscode-read-manifest to read commands
  info(`Running Command: ${cmd}`);
  info('------------------------------------------------------');
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
