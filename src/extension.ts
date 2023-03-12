import * as vscode from 'vscode';

import {Executor} from './commands/executor';
import {ICommand} from './lib/types';
import {IDE} from './lib/vscode-api';
import {infoDebug, outputChannel} from './lib/output-pane';
import {LinkConfigGit} from './commands/link-config-git';
import {LinkInit} from './commands/link-init';
import {LinkSearch} from './commands/link-search';
import {LinkTest} from './commands/link-test';
import {LinkValidateDecisions} from './commands/link-validate-decisions';
import {LocalStorageService} from './lib/local-storage-service';
import {SnippetInstaller} from './lib/snippet-installer';

// reference: https://github.com/bwateratmsft/memento-explorer
interface IMementoExplorerExtension {
  readonly memento: {
    readonly globalState?: vscode.Memento;
    readonly workspaceState?: vscode.Memento;
  };
}

// extension entry point
export async function activate(context: vscode.ExtensionContext): Promise<IMementoExplorerExtension> {
  outputChannel.show(true);
  infoDebug('Styra extension active!');
  LocalStorageService.instance.storage = context.workspaceState;

  // commands come from package.json::contribute.commands
  const styraCommands: { [key: string]: ICommand } = {
    'styra.link.init': new LinkInit(),
    'styra.link.config-git': new LinkConfigGit(),
    'styra.link.test': new LinkTest(),
    'styra.link.validate-decisions': new LinkValidateDecisions(),
    'styra.link.search': new LinkSearch(),
  };
  infoDebug(`Registering ${Object.keys(styraCommands).length} commands`);

  Object.entries(styraCommands).forEach(([cmd, target]) =>
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd, () => {
        Executor.run(target);
      })
    )
  );

  if (IDE.workspaceFolders()) {
    await new SnippetInstaller().addSnippetsToProject();
  }

  // Check the env context at the time VSCode is launched.
  // Will only expose the persistent storage if this env var is set as shown.
  // Thus to enable, start in your project's directory, set the var, then open VSCode:
  //     % export STYRA_VSCODE_ENV=development
  //     % cd <YOUR_PROJECT_DIR>
  //     % code .
  // Once running, open the Memento Explorer from the VSCode command palette.
  const DEV_MODE = process.env.STYRA_VSCODE_ENV === 'development';
  return {
    memento:
      DEV_MODE
        ? {globalState: context.globalState, workspaceState: context.workspaceState}
        : {}
  };
}
