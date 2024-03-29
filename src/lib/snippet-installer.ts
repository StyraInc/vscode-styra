import * as fs from 'fs';
import path = require('path');
import {IDE} from './vscode-api';
import {infoDebug, teeError} from './output-pane';
import {StyraConfig} from './styra-config';

const SNIPPET_DIR = 'snippets';
const SNIPPET_FILE = 'styra.code-snippets';

export class SnippetInstaller {

  async addSnippetsToProject(): Promise<void> {

    const vsix = IDE.getExtension('styra.vscode-styra');
    if (!vsix) {
      teeError('unable to find Styra extension');
      return;
    }
    const extensionRootDir = vsix.extensionPath;
    const dotDir = IDE.dotFolderForExtension();
    const srcName = await this.getSnippetFileName();

    if (!srcName) { // in case project has not been initialized yet
      return;
    }

    const srcPath = path.join(extensionRootDir, SNIPPET_DIR, srcName);
    const destPath = path.join(dotDir, SNIPPET_FILE);

    if (!this.srcFileExists(srcPath)) {
      infoDebug(`no snippets ${srcName} available`);
      return;
    }

    if (this.destFileExists(destPath) && await this.compareFiles(srcPath, destPath)) {
      infoDebug('Snippets up-to-date; skipping snippet installation.');
      return;
    }

    infoDebug(this.destFileExists(destPath)
      ? 'Snippets changed; updating...' : 'Snippets not installed yet; installing...');
    infoDebug(`  from: ${srcPath}`);
    infoDebug(`    to: ${destPath}`);

    if (!this.destDirExists(dotDir)) {
      fs.mkdirSync(dotDir);
    }
    fs.copyFileSync(srcPath, destPath);
  }

  // Whoa what? These serve a dual purpose:
  // (a) improve clarity of addSnippetsToProject some
  // (b) improve clarity of unit tests tremendously
  private srcFileExists = (path: string) => fs.existsSync(path);
  private destFileExists = (path: string) => fs.existsSync(path);
  private destDirExists = (path: string) => fs.existsSync(path);

  private async getSnippetFileName(): Promise<string> {
    const config = await StyraConfig.getProjectConfig();
    if (!config.name) {
      return '';
    }
    infoDebug(`project: ${config.name}`);
    infoDebug(`system type: ${config.projectType}`);
    return `${config.projectType}.json`;
  }

  private async compareFiles(file1: string, file2: string): Promise<boolean> {
    return await Promise.all([
      fs.promises.readFile(file1, 'utf8'),
      fs.promises.readFile(file2, 'utf8'),
    ]).then(([contents1, contents2]) => contents1 === contents2);
  }
}
