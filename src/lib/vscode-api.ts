import * as vscode from 'vscode';

// The IDE interface for VSCode.
// No `vscode...` calls should appear in almost any other file!

export class IDE {

  static createOutputChannel(name: string): vscode.OutputChannel {
    return vscode.window.createOutputChannel(name);
  }

  static workspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
    return vscode.workspace.workspaceFolders;
  }

  static getConfigValue(path: string, key: string): string | undefined {
    return vscode.workspace.getConfiguration(path).get<string>(key);
  }

  static showInformationMessage<T extends string>(msg: string, ...items: T[]): Thenable<string | undefined> {
    return vscode.window.showInformationMessage(msg, ...items);
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
