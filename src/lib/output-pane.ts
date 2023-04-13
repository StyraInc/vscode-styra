import {getSetting, Setting} from './ide-settings';
import {IDE} from './vscode-api';

export const outputChannel = IDE.createOutputChannel('Styra');
export const footnoteMsg = '(*) See output pane (*)';
const footnoteSymbol = '(*)';

// the workhorse that interacts with outputChanel
export function info(msg: string): void {
  // Back-end already filters these secrets; filtering here is just an extra backstop
  const filteredMsg = msg
    .replace(/-{5}BEGIN.+-{5}\s[a-zA-Z0-9+/\-_]*?\s-{5}END.+-{5}/s, '-*-*-REDACTED-*-*-')
    .replace(/"secret":\s*"[^"]+"/g, '"secret":"****"');
  if (filteredMsg && filteredMsg.endsWith('\n')) {
    outputChannel.append(filteredMsg); // remove superfluous newline
  } else {
    outputChannel.appendLine(filteredMsg);
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
  if (getSetting<boolean>(Setting.Diagnostic)) {
    const limit = getSetting<number>(Setting.DiagnosticLimit);
    if (limit !== -1 && msg.length > limit) {
      msg = msg.substring(0, limit) + '...';
    }
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
