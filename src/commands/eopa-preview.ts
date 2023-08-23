// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as utils from '../lib/eopaPreview/utils';
import * as vscode from 'vscode';
import {expandPathsStandard, expandPathStandard} from '../lib/eopaPreview/pathVars';
import {FilesAndData} from '../lib/eopaPreview/FilesAndData';
import {PreviewBuilder, PreviewOption} from '../lib/eopaPreview/Preview';
import {PreviewCodeLense} from '../lib/eopaPreview/PreviewCodeLense';

export const eopaPreviewChannel = vscode.window.createOutputChannel('Enterprise OPA Preview');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const previewLens = new PreviewCodeLense(previewCodeLenseEnabled());
  const disposables: vscode.Disposable[] = [
    vscode.commands.registerCommand('eopa.preview.package', () => runPreviewPackage(previewEnvironment(context))),
    vscode.commands.registerCommand('eopa.preview.file', () => runPreviewFile(previewEnvironment(context))),
    vscode.commands.registerCommand('eopa.preview.selection', () => runPreviewSelection(previewEnvironment(context))),
    vscode.commands.registerCommand('eopa.preview.setToken', () => runSetToken(previewEnvironment(context))),
    vscode.commands.registerCommand('eopa.preview.inspectToken', () => runInspectToken(previewEnvironment(context))),
    vscode.languages.registerCodeLensProvider({language: 'rego'}, previewLens),
    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
      if (!e.affectsConfiguration('eopa')) {
        return;
      }
      previewLens.setEnabled(previewCodeLenseEnabled());
    })
  ];

  // make sure all commands are pushed to subscriptions to ensure they are disposed of
  // when the extension is unloaded.
  disposables.map((d: vscode.Disposable) => context.subscriptions.push(d));
}

type PreviewEnvironment = {
    settings: PreviewSettings,
    fs: vscode.FileSystem,
    editor?: vscode.TextEditor,
    window?: vscode.WindowState,
    workspace?: readonly vscode.WorkspaceFolder[],
    secrets: vscode.SecretStorage,
};

type PreviewSettings = {
    url: string,
    roots: string[],
    prefix: string,
    options: PreviewOption[],
    ignores: string[],
    ca: string,
    allowUnauthorized: boolean,
    authType: utils.AuthType,
    clientCert: string,
    clientKey: string,
};

function previewSettings(editor?: vscode.TextEditor, workspace?: readonly vscode.WorkspaceFolder[]): PreviewSettings {
  const config = vscode.workspace.getConfiguration('eopa');
  return {
    url: config.get<string>('url', 'http://localhost:8181'),
    roots: expandPathsStandard(vscode.workspace.getConfiguration('opa').get<string[]>('roots', []), editor, workspace),
    prefix: config.get<string>('preview.prefix', ''),
    options: config.get<PreviewOption[]>('preview.arguments', []),
    ignores: config.get<string[]>('preview.ignore', ['**/.git*']),
    ca: expandPathStandard(config.get<string>('auth.clientCertCA', ''), editor, workspace),
    allowUnauthorized: config.get<boolean>('auth.allowUnauthorizedTLS', false),
    authType: config.get<utils.AuthType>('auth.type', 'none'),
    clientCert: expandPathStandard(config.get<string>('auth.clientCertPem', ''), editor, workspace),
    clientKey: expandPathStandard(config.get<string>('auth.clientKeyPem', ''), editor, workspace),
  };
}

function previewEnvironment(context: vscode.ExtensionContext): PreviewEnvironment {
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

function previewCodeLenseEnabled(): boolean {
  return vscode.workspace.getConfiguration('eopa').get<boolean>('preview.codeLense', true);
}

async function runPreviewPackage(args: PreviewEnvironment) {
  try {
    const path = utils.pathFromEditor(args.editor);
    const input = await utils.findInput(args.fs, args.editor, args.workspace);
    let filesAndData: FilesAndData | undefined;
    if (vscode.workspace.workspaceFolders) {
      filesAndData = await utils.rootsFilesAndData(args.fs, args.settings.roots, args.settings.prefix, args.settings.ignores);
    }

    const request = new PreviewBuilder(args.settings.url)
            .path(path)
            .input(input)
            .options(args.settings.options)
            .filesAndData(filesAndData)
            .agentOptions(await utils.httpsSettings(args.fs, args.settings.ca, args.settings.allowUnauthorized))
            .authProvider(await utils.initAuth(args.settings.authType, args.secrets, args.fs, args.settings.clientCert, args.settings.clientKey))
            .build();

    const result = await request.run();
    utils.reportResult(JSON.stringify(result, undefined, '  '), eopaPreviewChannel);
  } catch (e: unknown) {
    utils.reportError(e);
  }
}

async function runPreviewFile(args: PreviewEnvironment) {
  try {
    const path = utils.pathFromEditor(args.editor);
    const input = await utils.findInput(args.fs, args.editor, args.workspace);
    const filesAndData = utils.singleFileContent(args.editor, args.settings.roots, args.settings.prefix);

    const request = new PreviewBuilder(args.settings.url)
            .path(path)
            .input(input)
            .options(args.settings.options)
            .filesAndData(filesAndData)
            .agentOptions(await utils.httpsSettings(args.fs, args.settings.ca, args.settings.allowUnauthorized))
            .authProvider(await utils.initAuth(args.settings.authType, args.secrets, args.fs, args.settings.clientCert, args.settings.clientKey))
            .build();

    const result = await request.run();
    utils.reportResult(JSON.stringify(result, undefined, '  '), eopaPreviewChannel);
  } catch (e: unknown) {
    utils.reportError(e);
  }
}

async function runPreviewSelection(args: PreviewEnvironment) {
  try {
    const path = utils.pathFromEditor(args.editor);
    const input = await utils.findInput(args.fs, args.editor, args.workspace);
    const selection = utils.getEditorSelection(args.editor);
    let filesAndData: FilesAndData | undefined;
    if (vscode.workspace.workspaceFolders) {
      filesAndData = await utils.rootsFilesAndData(args.fs, args.settings.roots, args.settings.prefix, args.settings.ignores);
    }

    const request = new PreviewBuilder(args.settings.url)
            .path(path)
            .query(selection)
            .input(input)
            .options(args.settings.options)
            .filesAndData(filesAndData)
            .agentOptions(await utils.httpsSettings(args.fs, args.settings.ca, args.settings.allowUnauthorized))
            .authProvider(await utils.initAuth(args.settings.authType, args.secrets, args.fs, args.settings.clientCert, args.settings.clientKey))
            .build();

    const result = await request.run();
    utils.reportResult(JSON.stringify(result, undefined, '  '), eopaPreviewChannel);
  } catch (e: unknown) {
    utils.reportError(e);
  }
}

async function runSetToken(args: PreviewEnvironment) {
  const token = await vscode.window.showInputBox({
    password: true,
    placeHolder: '',
    prompt: 'Enter your bearer token for token based authentication to Enterprise OPA instances',
    title: 'Auth Token',
  });
  if (!token) {
    vscode.window.showWarningMessage('Token not stored: no token provided.');
    return;
  }
  await args.secrets.store('authToken', token);
  vscode.window.showInformationMessage('Token stored successfully.');
}

async function runInspectToken(args: PreviewEnvironment) {
  const token = await args.secrets.get('authToken');
  if (!token) {
    vscode.window.showInformationMessage('No token set. Use the "Enterprise OPA: Set Token" command');
    return;
  }
  utils.reportResult(`Your access token is set to: ${token}`, eopaPreviewChannel);
}
