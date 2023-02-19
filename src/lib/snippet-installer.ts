import * as fs from 'fs';
import path = require('path');
import {CONFIG_FILE_PATH, ProjectConfigData, StyraConfig} from './styra-config';
import {IDE} from './vscode-api';
import {info, teeError} from './outputPane';

export class SnippetInstaller {

  async addSnippetsToProject(): Promise<void> {

    const vsix = IDE.getExtension('styra.vscode-styra');
    if (!vsix) {
      teeError('unable to find Styra extension');
      return;
    }
    const snippetDir = vsix.extensionPath; // Get snippet file path from the plugin package
    const destSnippetFile = 'styra-snippets.code-snippets';

    const dotDir = IDE.dotFolderForExtension();
    info(`dotDir = ${dotDir}`);
    const srcPath = path.join(snippetDir, 'snippets', await SnippetInstaller.getSnippetFileName(IDE.projectDir()));
    const destPath = path.join(dotDir, destSnippetFile);
    info(`from: ${srcPath}\n  to: ${destPath}`);

    if (fs.existsSync(destPath) && await SnippetInstaller.compareFiles(srcPath, destPath)) {
      return;
    }

    info(`Installing snippets...\nfrom: ${srcPath}\n  to: ${destPath}`);

    if (!fs.existsSync(dotDir)) {
      fs.mkdirSync(dotDir);
    }
    fs.copyFileSync(srcPath, destPath);
  }

  static async getSnippetFileName(projectDir = '.'): Promise<string> {
    const configData: ProjectConfigData = await StyraConfig.read(path.join(projectDir, CONFIG_FILE_PATH), new ProjectConfigData());
    info(`identified ${configData.projectType} system type`);
    return `${configData.projectType}.json`;
  }

  static async compareFiles(file1: string, file2: string): Promise<boolean> {
    const contents1 = await fs.promises.readFile(file1, 'utf8');
    const contents2 = await fs.promises.readFile(file2, 'utf8');
    return contents1 === contents2;
  }
}
