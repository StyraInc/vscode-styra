import 'fetch-mock-jest';
import * as vscode from 'vscode';
import {expandPathsStandard, expandPathStandard} from '../../../lib/eopaPreview/pathVars';
import {mock, mockDeep} from 'jest-mock-extended';

const folder = mock<vscode.WorkspaceFolder>({uri: 'file:///test/path'});
const mockWorkspace = [folder];
const mockEditor = mockDeep<vscode.TextEditor>({document: {fileName: '/some/path/example.rego'}});

/* eslint-disable no-template-curly-in-string */
const testCases = [
  ['no/template/untouched.rego', 'no/template/untouched.rego'],
  ['${workspaceFolder}/example.rego', 'file:///test/path/example.rego'],
  ['${fileDirname}/example.rego', '/some/path/example.rego'],
  ['${workspaceFolder}${fileDirname}/example.rego', 'file:///test/path/some/path/example.rego'],
  ['${unknown}/example.rego', '/example.rego'],
];
/* eslint-enable */

describe('path vars', () => {
  test('removes tokens when then environment is undefined', () => {
    const template = '${workspaceFolder}${fileDirname}'; // eslint-disable-line no-template-curly-in-string
    const actual = expandPathStandard(template, undefined, undefined);
    expect(actual).toEqual('');
  });
  test.each(testCases)('expands %p to %p', (template: string, expanded: string) => {
    const actual = expandPathStandard(template, mockEditor, mockWorkspace);
    expect(actual).toEqual(expanded);
  });

  test('exposes expandPathsStandard to translate an array of path strings', () => {
    const templates: string[] = [];
    const expected: string[] = [];
    for (const tc of testCases) {
      templates.push(tc[0]);
      expected.push(tc[1]);
    }
    const actual = expandPathsStandard(templates, mockEditor, mockWorkspace);
    expect(actual.sort()).toEqual(expected.sort());
  });
});
