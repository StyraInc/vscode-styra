import * as fs from 'fs';
import path = require('path');
import {IDE} from './vscode-api';
import {info, teeError} from './outputPane';

export class SnippetInstaller {

  addSnippetsToProject(): void {

    const vsix = IDE.getExtension('styra.vscode-styra');
    if (!vsix) {
      teeError('unable to find Styra extension');
      return;
    }
    // Get file path from the plugin package
    const snippetFile = 'styra-snippets.code-snippets';
    const srcPath = path.join(vsix.extensionPath, 'snippets', snippetFile);

    // Get the path to the destination folder
    const destPath = path.join(IDE.cwd() ?? '/', '.vscode');

    info(`Installing snippets...\nfrom: ${srcPath}\n  to: ${destPath}`);

    // Copy the file
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
    fs.copyFileSync(srcPath, path.join(destPath, snippetFile));

  }
}
