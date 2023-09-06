import * as https from 'https';
import * as vscode from 'vscode';
import * as yaml from 'js-yaml';
import {AuthProvider, PreviewOption} from './Preview';
import {basename, dirname, join, sep} from 'path';
import {EnvironmentError} from './errors';
import {expandPathsStandard, expandPathStandard} from './pathVars';
import {FilesAndData, fsFilesAndData} from './FilesAndData';
import {TLSAuth, TokenAuth} from './auth';

export type PreviewEnvironment = {
  settings: PreviewSettings,
  fs: vscode.FileSystem,
  editor?: vscode.TextEditor,
  window?: vscode.WindowState,
  workspace?: readonly vscode.WorkspaceFolder[],
  secrets: vscode.SecretStorage,
};
export type PreviewSettings = {
  url: string,
  defaultQuery: string,
  roots: string[],
  prefix: string,
  options: PreviewOption[],
  strategy: FileStrategy,
  ignores: string[],
  ca: string,
  allowUnauthorized: boolean,
  authType: AuthType,
  clientCert: string,
  clientKey: string,
};
export type Parser = (data: string) => (object|undefined);
export type AuthType = 'none' | 'bearer' | 'tls';
export type FileStrategy = 'all' | 'file';

const packageRegex = /package ([a-zA-Z_].*)(?! )$/s;

export function previewSettings(editor?: vscode.TextEditor, workspace?: readonly vscode.WorkspaceFolder[]): PreviewSettings {
  const config = vscode.workspace.getConfiguration('eopa');
  return {
    url: config.get<string>('url', 'http://localhost:8181'),
    defaultQuery: config.get<string>('preview.defaultQuery', ''),
    roots: expandPathsStandard(vscode.workspace.getConfiguration('opa').get<string[]>('roots', []), editor, workspace),
    prefix: config.get<string>('preview.prefix', ''),
    options: config.get<PreviewOption[]>('preview.arguments', []),
    strategy: config.get<FileStrategy>('preview.strategy', 'all'),
    ignores: config.get<string[]>('preview.ignore', ['**/.git*']),
    ca: expandPathStandard(config.get<string>('auth.clientCertCA', ''), editor, workspace),
    allowUnauthorized: config.get<boolean>('auth.allowUnauthorizedTLS', false),
    authType: config.get<AuthType>('auth.type', 'none'),
    clientCert: expandPathStandard(config.get<string>('auth.clientCertPem', ''), editor, workspace),
    clientKey: expandPathStandard(config.get<string>('auth.clientKeyPem', ''), editor, workspace),
  };
}

export function previewEnvironment(context: vscode.ExtensionContext): PreviewEnvironment {
  const editor = vscode.window.activeTextEditor;
  const workspace = vscode.workspace.workspaceFolders;
  const fs = vscode.workspace.fs;

  return {
    settings: previewSettings(editor, workspace),
    editor,
    workspace,
    fs,
    secrets: context.secrets
  };
}

export function previewCodeLenseEnabled(): boolean {
  return vscode.workspace.getConfiguration('eopa').get<boolean>('preview.codeLense', true);
}

export function hasDefaultQuery(): boolean {
  return vscode.workspace.getConfiguration('eopa').get<string>('preview.defaultQuery', '') !== '';
}

/**
 * Check whether a document is Rego or not in a case-insensitive way
 *
 * @param doc The visual studio code text document to check the language of
 * @returns Whether or not the document is in the Rego language
 */
export function isRegoDoc(doc: vscode.TextDocument): boolean {
  const lang = doc.languageId;
  return lang.localeCompare('rego', 'en', {sensitivity: 'base'}) === 0;
}

/**
 * Get the Rego package from a the active editor as long as it is a Rego file.
 *
 * This uses a regular expression to extract the package name from a Rego
 * document. It would be better to actually parse the rego, but there is no
 * assumption that a copy of OPA is readily available for this parsing. This
 * can certainly be a future improvement, but this will catch 99+% of cases.
 * False positives from this check will simply fail when the rego is queried.
 *
 * @param doc The visual studio code text document to get the package from
 */
export function getRegoPackage(doc: vscode.TextDocument): null | string {
  // Find the first non-comment, non-whitespace line and look for the package
  for (let i = 0; i < doc.lineCount; i++) {
    const line = doc.lineAt(i);
    if (line.isEmptyOrWhitespace) {
      continue;
    }
    const text = line.text.substring(line.firstNonWhitespaceCharacterIndex);
    if (text[0] === '#') {
      continue;
    }
    const match = packageRegex.exec(text);
    if (match === null || match.length < 2) {
      break;
    }
    return match[1]; // Index 1 is the captured group, which is the package name
  }
  return null;
}

/**
 * Turn a standard rego package namespace into a package path
 *
 * @param path A rego package path string
 * @returns A path version of the rego package string
 */
export function getPackagePath(path: string): string {
  let _path = path;
  const matcher = /\["(.+)"\]/g;
  let match = matcher.exec(_path);
  const brackets: string[] = [];
  while (match !== null) {
    brackets[match.index] = match[1];
    _path = _path.replace(match[0], `.%${match.index}`);
    match = matcher.exec(_path);
  }
  _path = _path.replace(/\./g, '/');
  brackets.forEach((val, i) => {
    _path = _path.replace(`%${i}`, val);
  });

  return _path;
}

export function formatResults(results: object): string {
  return JSON.stringify(results, undefined, '  ');
}

/**
 * Reports a result to the Enterprise OPA Preview pane
 */
export function reportResult(message:string, channel: vscode.OutputChannel) {
  channel.clear();
  channel.append(message);
  channel.show(true);
}

export function reportError(e: unknown) {
  if (e instanceof Error) {
    vscode.window.showErrorMessage(e.toString());
    return;
  }
  vscode.window.showErrorMessage('Unknown error. See development console for details.');
  console.log('Unknown error', e); // eslint-disable-line no-console
}

export async function getFilesAndData(args: PreviewEnvironment): Promise<FilesAndData> {
  let strategy = args.settings.strategy;
  if (!args.workspace) {
    vscode.window.showWarningMessage('No active workspace, using single file strategy. Open a workspace to use other strategies');
    strategy = 'file';
  }
  switch (strategy) {
    case 'file':
      return singleFileContent(args.editor, args.settings.roots, args.settings.prefix);
    default:
      return rootsFilesAndData(args.fs, args.settings.roots, args.settings.prefix, args.settings.ignores);
  }
}

export async function rootsFilesAndData(fs: vscode.FileSystem, roots: string[], prefix: string, ignore: string[]): Promise<FilesAndData> {
  let allFilesAndData = new FilesAndData({}, {}).setPrefix(prefix);
  for (const root of roots) {
    const f = vscode.Uri.parse(root);
    const rootFilesAndData = await fsFilesAndData(fs, f, '', ignore);
    allFilesAndData = allFilesAndData.combine(rootFilesAndData);
  }

  return allFilesAndData;
}

export function singleFileContent(editor: vscode.TextEditor|undefined, roots: string[], prefix: string): FilesAndData {
  if (editor === undefined) {
    throw new EnvironmentError('No active editor.');
  }
  const contents = editor.document.getText();
  const absPath = editor.document.fileName;
  let name = basename(absPath);
  // Try to find a root this file belongs
  for (const root of roots) {
    const rootUri = vscode.Uri.parse(root);
    if (absPath.startsWith(rootUri.path)) {
      name = absPath.substring(rootUri.path.length);
      // Depending on how the root was defined, we may still have a path separator prefix
      // and we don't want that.
      if (name.startsWith(sep)) {
        name = name.substring(1);
      }
      break;
    }
  }
  return new FilesAndData({[name]: contents}, {}).setPrefix(prefix);
}

/**
 * Provide input from a file next to the currently opened file or at the workspace root.
 *
 * This creates a function suitable for use as an input provider which tries to find a data file
 * called 'input.json' in JSON format or 'input.yaml' in YAML format which is a sibling of the
 * currently active file, or is at the workspace root if a workspace is available.
 *
 * @param fs A file system implementation used for searching
 * @param editor The active editor to use as a reference
 * @param workspace The current set of VS Code Workspace Folders
 * @returns A function that can be used as an input provider
 */
export async function findInput(fs: vscode.FileSystem, editor?: vscode.TextEditor, workspace?: readonly vscode.WorkspaceFolder[]): Promise<object|undefined> {
  if (editor === undefined) {
    return;
  }
  const searchPaths: {path: vscode.Uri, parser: Parser}[] = [];
  // look for input.json at the active editor's directory, or the workspace directory
  const activeDir = dirname(editor.document.uri.fsPath);
  searchPaths.push({path: vscode.Uri.file(join(activeDir, 'input.json')), parser: JSON.parse});
  searchPaths.push({path: vscode.Uri.file(join(activeDir, 'input.yaml')), parser: parseYaml});

  if (workspace !== undefined && workspace.length > 0) {
    const root = workspace[0].uri;
    searchPaths.push({path: root.with({path: join(root.path, 'input.json')}), parser: JSON.parse});
    searchPaths.push({path: root.with({path: join(root.path, 'input.yaml')}), parser: parseYaml});
  }

  for (const searchPath of searchPaths) {
    try {
      await fs.stat(searchPath.path);
      const raw = (await fs.readFile(searchPath.path)).toString();
      if (raw !== '') {
        return searchPath.parser(raw);
      }
    } catch {
      // file does not exist or was somehow not valid
      continue;
    }
  }
  return;
}

export function pathFromEditor(editor?: vscode.TextEditor): string {
  if (editor === undefined) {
    throw new EnvironmentError('No active editor');
  }
  const document = editor.document;
  if (!isRegoDoc(document)) {
    throw new EnvironmentError('The active document is not a Rego document');
  }
  const pkg = getRegoPackage(document);
  if (pkg === null) {
    throw new EnvironmentError('A valid Rego package was not found in the current document');
  }

  return getPackagePath(pkg);
}

export function parseYaml(data: string): object|undefined {
  const result = yaml.load(data);
  if (typeof result === 'object' && result !== null) {
    return result;
  }
}

export function getEditorSelection(editor?: vscode.TextEditor): string {
  if (editor === undefined) {
    throw new EnvironmentError('No active editor');
  }
  const text = editor.document.getText(editor.selection);
  if (text === '') {
    throw new EnvironmentError('Nothing selected to preview');
  }

  return text;
}

export async function httpsSettings(fs: vscode.FileSystem, ca: string, allowUnauthorized: boolean): Promise<https.AgentOptions | undefined> {
  if (ca === '' && !allowUnauthorized) {
    return;
  }
  const options: https.AgentOptions = {
    rejectUnauthorized: !allowUnauthorized,
  };

  if (ca !== '') {
    const caFile = vscode.Uri.parse(ca);
    const caBytes = await fs.readFile(caFile);
    options.ca = caBytes.toString();
    options.requestCert = true;
    options.keepAlive = false;
  }

  return options;
}

export async function initAuth(authType: AuthType, secrets: vscode.SecretStorage, fs: vscode.FileSystem, cert: string, key: string): Promise<AuthProvider|undefined> {
  let provider: AuthProvider | undefined;
  switch (authType) {
    case 'bearer':
      {
        const token = await secrets.get('authToken');
        if (!token) {
          vscode.window.showWarningMessage('bearer auth selected, but no token was found. Use the "Enterprise OPA: Set Token" command to set one.');
          return;
        }
        provider = new TokenAuth(token);
      }
      break;
    case 'tls':
      {
        const certFile = vscode.Uri.parse(cert);
        const keyFile = vscode.Uri.parse(key);
        const certBytes = await fs.readFile(certFile);
        const keyBytes = await fs.readFile(keyFile);
        provider = new TLSAuth(certBytes.toString(), keyBytes.toString());
      }
      break;
    default:
      break;
  }

  return provider;
}
