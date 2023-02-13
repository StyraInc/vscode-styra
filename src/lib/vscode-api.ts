import * as vscode from 'vscode';

// The IDE interface for VSCode.
// No `vscode...` calls should appear in almost any other file!

export type QuickPickItem = vscode.QuickPickItem

type ProgressItemDetails = vscode.Progress<{
  increment?: number;
  message: string;
}>;

export class IDE {

  static ProgressLocation = vscode.ProgressLocation;

  static async withProgress<T>(
    options: vscode.ProgressOptions,
    task: (progress: ProgressItemDetails, token: vscode.CancellationToken) => Thenable<T>): Promise<T> {
    return vscode.window.withProgress(options, task);
  }

  static createOutputChannel(name: string): vscode.OutputChannel {
    return vscode.window.createOutputChannel(name);
  }

  static workspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
    return vscode.workspace.workspaceFolders;
  }

  static getConfigValue<P>(path: string, key: string): P | undefined {
    return vscode.workspace.getConfiguration(path).get<P>(key);
  }

  // while this family of methods could take an items array for button choices,
  // it times out after 30 seconds and the code just... stops!
  static showInformationMessage(msg: string): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(msg);
  }

  static showInformationMessageModal<T extends string>(msg: string, ...items: T[]): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(msg, {modal: true}, ...items);
  }

  static showWarningMessage(msg: string): Thenable<string | undefined> {
    return vscode.window.showWarningMessage(msg);
  }

  static showErrorMessage<T extends string>(msg: string): Thenable<T | undefined> {
    return vscode.window.showErrorMessage(msg);
  }

  static showInputBox(options: vscode.InputBoxOptions | undefined): Thenable<string | undefined> {
    return vscode.window.showInputBox(options);
  }
}
