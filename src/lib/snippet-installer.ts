import * as fs from 'fs';
import path = require('path');
import {IDE} from './vscode-api';
import {info, teeError} from './outputPane';

export class SnippetInstaller {

  async addSnippetsToProject(): Promise<void> {

    const vsix = IDE.getExtension('styra.vscode-styra');
    if (!vsix) {
      teeError('unable to find Styra extension');
      return;
    }
    const snippetFile = 'styra-snippets.code-snippets';

    // Get snippet file path from the plugin package
    const srcPath = path.join(vsix.extensionPath, 'snippets', snippetFile);
    const destDir = IDE.dotFolderForExtension();
    const destPath = path.join(destDir, snippetFile);

    if (fs.existsSync(destPath) && await SnippetInstaller.compareFiles(srcPath, destPath)) {
      return;
    }

    info(`Installing snippets...\nfrom: ${srcPath}\n  to: ${destPath}`);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir);
    }
    fs.copyFileSync(srcPath, destPath);
  }

  static async compareFiles(file1: string, file2: string): Promise<boolean> {
    const contents1 = await fs.promises.readFile(file1, 'utf8');
    const contents2 = await fs.promises.readFile(file2, 'utf8');
    return contents1 === contents2;
  }
}
