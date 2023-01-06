import * as vscode from 'vscode';
import { LogReplay } from './commands/log-replay';
import { info, outputChannel } from './lib/outputPane';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {

  outputChannel.show(true);
  info('Styra extension active!');

  context.subscriptions.push(
    vscode.commands.registerCommand('styra.log.replay', () => {
      new LogReplay().runLogReplay();
    })
  );
}

