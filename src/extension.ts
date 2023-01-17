import * as vscode from 'vscode';

import { info, outputChannel } from './lib/outputPane';
import { ICommand } from './lib/types';
import { LinkGitConfig } from './commands/link-git-config';
import { LinkInit } from './commands/link-init';
import { LinkTest } from './commands/link-test';
import { LogReplay } from './commands/log-replay';

// extension entry point
export function activate(context: vscode.ExtensionContext): void {
  outputChannel.show(true);
  info('Styra extension active!');

  // commands come from package.json::contribute.commands
  const styraCommands: { [key: string]: ICommand } = {
    'styra.link.init': new LinkInit(),
    'styra.link.git-config': new LinkGitConfig(),
    'styra.link.test': new LinkTest(),
    'styra.log.replay': new LogReplay()
  };

  Object.entries(styraCommands).forEach(([cmd, target]) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd, () => {
        target.run();
      })
    )
  );
}
