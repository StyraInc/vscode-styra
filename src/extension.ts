import * as vscode from "vscode";
import { LogReplay } from "./commands/log-replay";
import { log, outputChannel } from "./lib/output";


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

