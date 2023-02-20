import * as fs from 'fs';
import path = require('path');
import {IDE} from './vscode-api';
import {infoDebug, teeError} from './outputPane';
import {StyraConfig} from './styra-config';

export class SnippetInstaller {

  async addSnippetsToProject(): Promise<void> {

    const vsix = IDE.getExtension('styra.vscode-styra');
    if (!vsix) {
      teeError('unable to find Styra extension');
      return;
    }
    const extensionRootDir = vsix.extensionPath;
    const destSnippetFile = 'styra-snippets.code-snippets';

    const dotDir = IDE.dotFolderForExtension();
    const srcName = await SnippetInstaller.getSnippetFileName();
    const srcPath = path.join(extensionRootDir, 'snippets', srcName);
    const destPath = path.join(dotDir, destSnippetFile);

    if (!fs.existsSync(srcPath)) {
      infoDebug(`no snippets ${srcName} available`);
      return;
    }

    if (fs.existsSync(destPath) && await SnippetInstaller.compareFiles(srcPath, destPath)) {
      infoDebug('Snippets up-to-date; skipping snippet installation.');
      return;
    }

    infoDebug(fs.existsSync(destPath) ? 'Snippets changed; updating...' : 'Snippets not installed yet; installing...');
    infoDebug(`  from: ${srcPath}`);
    infoDebug(`    to: ${destPath}`);

    if (!fs.existsSync(dotDir)) {
      fs.mkdirSync(dotDir);
    }
    fs.copyFileSync(srcPath, destPath);
  }

  private static async getSnippetFileName(): Promise<string> {
    const config = await StyraConfig.getProjectConfig();
    infoDebug(`project: ${config.name}`);
    infoDebug(`system type: ${config.projectType}`);
    return `${config.projectType}.json`;
  }

  private static async compareFiles(file1: string, file2: string): Promise<boolean> {
    const contents1 = await fs.promises.readFile(file1, 'utf8');
    const contents2 = await fs.promises.readFile(file2, 'utf8');
    return contents1 === contents2;
  }
}
