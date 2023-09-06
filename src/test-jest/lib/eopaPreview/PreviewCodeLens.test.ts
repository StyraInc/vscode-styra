import 'fetch-mock-jest';
import * as vscode from 'vscode';
import {PreviewCodeLens} from '../../../lib/eopaPreview/PreviewCodeLens';

describe('PreviewCodeLens', () => {
  test('adds no code lenses when it is disabled', async () => {
    const previewCodeLens = new PreviewCodeLens(false, false);
    const lenses = await previewCodeLens.provideCodeLenses();
    expect(lenses.length).toBe(0);
  });

  test('adds one code lens when it is enabled with no default query', async () => {
    const previewCodeLens = new PreviewCodeLens(true, false);
    const lenses = await previewCodeLens.provideCodeLenses();
    expect(lenses.length).toBe(1);
    expect(vscode.CodeLens).lastCalledWith(expect.anything(), {
      title: 'Run Preview',
      command: 'eopa.preview.default',
    });
  });

  test('adds two code lenses when it is enabled with no default query', async () => {
    const previewCodeLens = new PreviewCodeLens(true, true);
    const lenses = await previewCodeLens.provideCodeLenses();
    expect(lenses.length).toBe(2);
    expect(vscode.CodeLens).nthCalledWith(1, expect.anything(), {
      title: 'Run Preview',
      command: 'eopa.preview.default',
    });
    expect(vscode.CodeLens).nthCalledWith(2 as number, expect.anything(), {
      title: 'Run Package Preview',
      command: 'eopa.preview.package',
    });
  });

  test('is reconfigurable as VS Code settings change', async () => {
    const previewCodeLens = new PreviewCodeLens(false, false);
    let lenses = await previewCodeLens.provideCodeLenses();
    expect(lenses.length).toBe(0);
    previewCodeLens.setEnabled(true);
    previewCodeLens.setHasDefaultQuery(false);
    lenses = await previewCodeLens.provideCodeLenses();
    expect(lenses.length).toBe(1);
    previewCodeLens.setEnabled(true);
    previewCodeLens.setHasDefaultQuery(true);
    lenses = await previewCodeLens.provideCodeLenses();
    expect(lenses.length).toBe(2);

  });
});
