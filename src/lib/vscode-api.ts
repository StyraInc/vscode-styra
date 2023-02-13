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

  static showInformationMessage<T extends string>(msg: string, ...items: T[]): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(msg, ...items);
  }

  static showInformationMessageModal<T extends string>(msg: string, ...items: T[]): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(msg, {modal: true}, ...items);
  }

  static showWarningMessage<T extends string>(msg: string, ...items: T[]): Thenable<string | undefined> {
    return vscode.window.showWarningMessage(msg, ...items);
  }

  static showErrorMessage<T extends string>(msg: string, ...items: T[]): Thenable<T | undefined> {
    return vscode.window.showErrorMessage(msg, ...items);
  }

  static showInputBox(options: vscode.InputBoxOptions | undefined): Thenable<string | undefined> {
    return vscode.window.showInputBox(options);
  }
}
