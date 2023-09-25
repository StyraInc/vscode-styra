// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as utils from '../lib/eopaPreview/utils';
import * as vscode from 'vscode';
import {PreviewBuilder} from '../lib/eopaPreview/Preview';
import {PreviewCodeLens} from '../lib/eopaPreview/PreviewCodeLens';

export const eopaPreviewChannel = vscode.window.createOutputChannel('Enterprise OPA Preview');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const previewLens = new PreviewCodeLens(utils.previewCodeLenseEnabled(), utils.hasDefaultQuery());
  const disposables: vscode.Disposable[] = [
    vscode.commands.registerCommand('eopa.preview.default', () => runPreviewDefault(utils.previewEnvironment(context))),
    vscode.commands.registerCommand('eopa.preview.package', () => runPreviewPackage(utils.previewEnvironment(context))),
    vscode.commands.registerCommand('eopa.preview.selection', () => runPreviewSelection(utils.previewEnvironment(context))),
    vscode.commands.registerCommand('eopa.preview.setToken', () => runSetToken(utils.previewEnvironment(context))),
    vscode.languages.registerCodeLensProvider({language: 'rego'}, previewLens),
    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
      if (!e.affectsConfiguration('enterpriseOPA')) {
        return;
      }
      previewLens.setEnabled(utils.previewCodeLenseEnabled());
      previewLens.setHasDefaultQuery(utils.hasDefaultQuery());
    })
  ];

  // make sure all commands are pushed to subscriptions to ensure they are disposed of
  // when the extension is unloaded.
  disposables.map((d: vscode.Disposable) => context.subscriptions.push(d));
}

export function runPreviewDefault(args: utils.PreviewEnvironment) {
  if (!args.settings.defaultQuery) {
    return runPreviewPackage(args);
  }
  return runPreview(args, utils.getPackagePath(args.settings.defaultQuery), '');
}

export function runPreviewPackage(args: utils.PreviewEnvironment) {
  return runPreview(args, utils.pathFromEditor(args.editor), '');
}

export function runPreviewSelection(args: utils.PreviewEnvironment) {
  return runPreview(args, utils.pathFromEditor(args.editor), utils.getEditorSelection(args.editor));
}

export async function runSetToken(args: utils.PreviewEnvironment) {
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

async function runPreview(args: utils.PreviewEnvironment, path: string, query: string) {
  try {
    const request = new PreviewBuilder(args.settings.url)
      .path(path)
      .query(query)
      .input(await utils.findInput(args.fs, args.editor, args.workspace))
      .options(args.settings.options)
      .filesAndData(await utils.getFilesAndData(args))
      .agentOptions(await utils.httpsSettings(args.fs, args.settings.ca, args.settings.allowUnauthorized))
      .authProvider(await utils.initAuth(args.settings.authType, args.secrets, args.fs, args.settings.clientCert, args.settings.clientKey))
      .build();

    const result = await request.run();
    utils.reportResult(utils.formatResults(result, query !== ''), eopaPreviewChannel);
  } catch (e: unknown) {
    utils.reportError(e);
  }
}
