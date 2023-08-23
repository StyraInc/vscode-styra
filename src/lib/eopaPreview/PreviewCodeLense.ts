import * as vscode from 'vscode';

/**
 * PreviewCodeLense
 */
export class PreviewCodeLense implements vscode.CodeLensProvider {

  private enabled: boolean;
  private codeLenses: vscode.CodeLens[] = [];
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  public setEnabled(enabled: boolean) {
    if (enabled === this.enabled) {
      return;
    }
    this.enabled = enabled;
    this._onDidChangeCodeLenses.fire();
  }

  public provideCodeLenses(): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    this.codeLenses = [];
    if (!this.enabled) {
      return this.codeLenses;
    }

    const topOfDocument = new vscode.Range(0, 0, 0, 0);
    this.codeLenses.push(new vscode.CodeLens(topOfDocument, {
      title: 'preview package',
      command: 'eopa.preview.package',
    }));
    this.codeLenses.push(new vscode.CodeLens(topOfDocument, {
      title: 'preview file',
      command: 'eopa.preview.file',
    }));
    return this.codeLenses;
  }
}
