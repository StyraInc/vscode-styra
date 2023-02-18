import * as fs from 'fs';
import path = require('path');
import * as vscode from 'vscode';
import {info, teeError} from './outputPane';

export class SnippetInstaller {

  addSnippetsToProject(): void {

    const vsix = vscode.extensions.getExtension('styra.vscode-styra');
    if (!vsix) {
      teeError('unable to find Styra extension');
      return;
    }
    // Get file path from the plugin package
    const vsixPath = vscode.Uri.file(vsix.extensionPath);
    const snippetFile = 'styra-snippets.code-snippets';
    const srcPath = vscode.Uri.file(path.join(vsixPath.fsPath, 'snippets', snippetFile));

    // Get the path to the destination folder
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const workspaceFolderPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
    const destPath = path.join(workspaceFolderPath, '.vscode');

    info(`Installing snippets...\nfrom: ${srcPath.fsPath}\n  to: ${destPath}`);

    // Copy the file
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
    fs.copyFileSync(srcPath.fsPath, path.join(destPath, snippetFile));

  }
}
