import {IDE} from './vscode-api';

export const outputChannel = IDE.createOutputChannel('Styra');
export const footnoteMsg = '(*) See output pane (*)';
const footnoteSymbol = '(*)';

// the workhorse that interacts with outputChanel
export function info(msg: string): void {
  if (msg && msg.endsWith('\n')) {
    outputChannel.append(msg); // remove superfluous newline
  } else {
    outputChannel.appendLine(msg);
  }
}

// Use this to provide supplemental description for an input box or pick box.
export function infoInput(msg: string): void {
  info('');
  info(`${footnoteSymbol} ${msg}`);
}

// Use this to introduce a multi-step dialog whenever you use one.
export function infoDiagram(title: string, flow: string): void {
  info('');
  info(`Here is the flow of ${title} that you just started: ${flow}`);
}

// Use this when emitting a message directly caused by an action from the user.
export function infoFromUserAction(msg: string): void {
  info('');
  info(`[USER]: ${msg}`);
}

// Use this to report debug-level messages
export function infoDebug(msg: string): void {
  if (IDE.getConfigValue<boolean>('styra', 'debug')) {
    info(`[DEBUG]: ${msg}`);
  }
}

export function teeInfo(msg: string): void {
  info(msg);
  IDE.showInformationMessage(msg);
}

export function teeWarning(msg: string): void {
  info(`WARNING: ${msg}`);
  IDE.showWarningMessage(msg);
}

export function teeError(msg: string): void {
  info(`ERROR: ${msg}`);
  IDE.showErrorMessage(msg);
}
