import * as vscode from "vscode";
import { LogReplay } from "./commands/log-replay";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-styra" is now active!');

  context.subscriptions.push(
    vscode.commands.registerCommand("styra.log.replay", () => {
      new LogReplay().runLogReplay();
    })
  );
}

