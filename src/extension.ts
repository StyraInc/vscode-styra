import * as vscode from 'vscode';

import {Executor} from './commands/executor';
import {ICommand} from './lib/types';
import {info, outputChannel} from './lib/outputPane';
import {LinkConfigGit} from './commands/link-config-git';
import {LinkInit} from './commands/link-init';
import {LinkSearch} from './commands/link-search';
import {LinkTest} from './commands/link-test';
import {LinkValidateDecisions} from './commands/link-validate-decisions';
import {LocalStorageService} from './lib/local-storage-service';

// reference: https://github.com/bwateratmsft/memento-explorer
interface IMementoExplorerExtension {
  readonly memento: {
    readonly globalState?: vscode.Memento;
    readonly workspaceState?: vscode.Memento;
  };
}

// extension entry point
export function activate(context: vscode.ExtensionContext): IMementoExplorerExtension {
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
        Executor.run(target);
      })
    )
  );

  // Check the env context at the time VSCode is launched.
  // Will only expose the persistent storage if this env var is set as shown.
  // Thus to enable, start in your project's directory, set the var, then open VSCode:
  //     % export STYRA_VSCODE_ENV=development
  //     % cd <YOUR_PROJECT_DIR>
  //     % code .
  const DEV_MODE = process.env.STYRA_VSCODE_ENV === 'development';
  return {
    memento:
      DEV_MODE
        ? {globalState: context.globalState, workspaceState: context.workspaceState}
        : {}
  };
}
