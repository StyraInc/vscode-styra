import * as vscode from 'vscode';

export const outputChannel = vscode.window.createOutputChannel('Styra');

// the workhorse that interacts with outputChanel
export function info(msg: string): void {
  if (msg.endsWith('\n')) {
    outputChannel.append(msg); // remove superfluous newline
  } else {
    outputChannel.appendLine(msg);
  }
}

// Use this at the start of the ICommand:run() method for every command.
export function infoNewCmd(cmd: string): void {
  info('');
  info('------------------------------------------------------');
  // TODO: use https://www.npmjs.com/package/vscode-read-manifest to read commands
  info(`Running Command: ${cmd}`);
  info('------------------------------------------------------');
}

// Use this to provide supplemental description for an input box or pick box.
export function infoInput(msg: string): void {
  info('');
  info(`*** Input note: ${msg}`);
}

// Use this when emitting a message directly caused by an action from the user.
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
