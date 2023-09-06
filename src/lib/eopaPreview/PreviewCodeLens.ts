import * as vscode from 'vscode';

/**
 * PreviewCodeLense
 */
export class PreviewCodeLens implements vscode.CodeLensProvider {

  private enabled: boolean;
  private hasDefaultQuery: boolean;
  private codeLenses: vscode.CodeLens[] = [];
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(enabled: boolean, hasDefaultQuery: boolean) {
    this.enabled = enabled;
    this.hasDefaultQuery = hasDefaultQuery;
  }

  public setEnabled(enabled: boolean) {
    if (enabled === this.enabled) {
      return;
    }
    this.enabled = enabled;
    this._onDidChangeCodeLenses.fire();
  }

  public setHasDefaultQuery(hasDefaultQuery: boolean) {
    if (hasDefaultQuery === this.hasDefaultQuery) {
      return;
    }
    this.hasDefaultQuery = hasDefaultQuery;
    this._onDidChangeCodeLenses.fire();
  }

  public provideCodeLenses(): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    this.codeLenses = [];
    if (!this.enabled) {
      return this.codeLenses;
    }

    const topOfDocument = new vscode.Range(0, 0, 0, 0);
    this.codeLenses.push(new vscode.CodeLens(topOfDocument, {
      title: 'Run Preview',
      command: 'eopa.preview.default',
    }));
    if (this.hasDefaultQuery) {
      this.codeLenses.push(new vscode.CodeLens(topOfDocument, {
        title: 'Run Package Preview',
        command: 'eopa.preview.package',
      }));
    }
    return this.codeLenses;
  }
}
