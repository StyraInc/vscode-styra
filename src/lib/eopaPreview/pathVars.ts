import * as vscode from 'vscode';
import {dirname} from 'path';

type PathVarProcessors = {[pathVar: string]: () => string };

export function expandPathStandard(path: string, editor?: vscode.TextEditor, workspace?: readonly vscode.WorkspaceFolder[]): string {
  return pathVarMapper(standardPathVars(editor, workspace))(path);
}

export function expandPathsStandard(paths: string[], editor?: vscode.TextEditor, workspace?: readonly vscode.WorkspaceFolder[]): string[] {
  return paths.map(pathVarMapper(standardPathVars(editor, workspace)));
}

export function pathVarMapper(pathVars: PathVarProcessors): (path: string) => string {
  return (path: string): string => path.replace(/\${([a-zA-Z-_].+?)}/g, (match: string, pathVar: string): string => {
    if (!pathVars[pathVar]) {
      vscode.window.showWarningMessage(`$\{${pathVar}} path variable us unknown`);
      return '';
    }
    return pathVars[pathVar]();
  });
}

function standardPathVars(editor?: vscode.TextEditor, workspace?: readonly vscode.WorkspaceFolder[]): PathVarProcessors {
  return {
    workspaceFolder: () => {
      if (workspace === undefined) {
        // eslint-disable-next-line no-template-curly-in-string
        vscode.window.showWarningMessage('${workspaceFolder} variable configured in settings, but no workspace is active');
        return '';
      }
      return workspace[0].uri.toString();
    },
    fileDirname: () => {
      if (editor === undefined) {
        // eslint-disable-next-line no-template-curly-in-string
        vscode.window.showWarningMessage('${fileDirname} variable configured in settings, but no document is active');
        return '';
      }
      return dirname(editor.document.fileName);
    }
  };
}
