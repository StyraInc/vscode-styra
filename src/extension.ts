import * as vscode from 'vscode';
import { LogReplay } from './commands/log-replay';
import { LinkInit } from './commands/link-init';
import { info, outputChannel } from './lib/outputPane';
import { ICommand } from './lib/types';

// extension entry point
export function activate(context: vscode.ExtensionContext): void {
  outputChannel.show(true);
  info('Styra extension active!');

  // commands come from package.json::contribute.commands
  const styraCommands: { [key: string]: ICommand } = {
    'styra.log.replay': new LogReplay(),
    'styra.link.init': new LinkInit(),
  };

  Object.entries(styraCommands).forEach(([cmd, target]) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd, () => {
        target.run();
      })
    )
  );
}
