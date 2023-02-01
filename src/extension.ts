import * as vscode from 'vscode';

import {ICommand} from './lib/types';
import {info, outputChannel} from './lib/outputPane';
import {LinkConfigGit} from './commands/link-config-git';
import {LinkInit} from './commands/link-init';
import {LinkSearch} from './commands/link-search';
import {LinkTest} from './commands/link-test';
import {LinkValidateDecisions} from './commands/link-validate-decisions';
import {LocalStorageService} from './lib/local-storage-service';

// extension entry point
export function activate(context: vscode.ExtensionContext): void {
  outputChannel.show(true);
  info('Styra extension active!');
  LocalStorageService.instance.storage = context.workspaceState;

  // commands come from package.json::contribute.commands
  const styraCommands: { [key: string]: ICommand } = {
    'styra.link.init': new LinkInit(),
    'styra.link.config-git': new LinkConfigGit(),
    'styra.link.test': new LinkTest(),
    'styra.link.validate-decisions': new LinkValidateDecisions(),
    'styra.link.search': new LinkSearch(),
  };

  Object.entries(styraCommands).forEach(([cmd, target]) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd, () => {
        target.run();
      })
    )
  );

}
