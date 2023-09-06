import 'fetch-mock-jest';
import fetch from 'node-fetch';
import * as eopaPreview from '../../commands/eopa-preview';
import * as utils from '../../lib/eopaPreview/utils';
import * as vscode from 'vscode';
import {_DeepMockProxy, _MockProxy} from 'jest-mock-extended/lib/Mock';
import {Agent} from 'https';
import {basename} from 'path';
import {FileError} from '../../lib/eopaPreview/errors';
import {mock, mockDeep} from 'jest-mock-extended';
import {PreviewOption} from '../../lib/eopaPreview/Preview';
import type {FetchMockStatic} from 'fetch-mock';

// Mock 'node-fetch' with 'fetch-mock-jest'. Note that using
// require here is important, because jest automatically
// hoists `jest.mock()` calls to the top of the file (before
// imports), so if we were to refer to an imported module, we
// would get a `ReferenceError`
// eslint-disable-next-line @typescript-eslint/no-var-requires
jest.mock('node-fetch', () => require('fetch-mock-jest').sandbox());

const fetchMock = (fetch as unknown) as FetchMockStatic;

const regoFile1 = 'package test\n\nhello := "world"';
const regoFile2 = 'package test\n\nfoo := "bar"';

afterEach(() => {
  fetchMock.reset();
});

describe('EOPA Preview Commands', () => {
  test('eopa.preview.default runs with the default query', async () => {
    const expectedUrl = 'http://example.com/v0/preview/some/package';
    const expectedResult = {result: {}};

    const env = getTestEnv();

    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    fetchMock.post(expectedUrl, expectedResult);

    env.args.settings.defaultQuery = 'some.package';
    await eopaPreview.runPreviewDefault(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {rego_modules: {'example.rego': regoFile1}},
    });
  });

  test('eopa.preview.default falls back to package preview when no default is specified', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();

    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewDefault(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {rego_modules: {'example.rego': regoFile1}},
    });

  });

  test('eopa.preview.package runs', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();

    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {rego_modules: {'example.rego': regoFile1}},
    });
  });

  test('eopa.preview.selection runs', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}}; // TODO: MATCH ACTUAL RETURN SHAPE
    const expectedRego = 'hello := "world"';

    const range = mock<vscode.Range>();
    const env = getTestEnv({
      editor: {
        document: {fileName: '/example/path/example.rego', languageId: 'rego', lineCount: 1, uri: {fsPath: '/example/path/example.rego'}},
        selection: range,
      }
    });
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValueOnce(expectedRego).mockReturnValue(regoFile1);
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewSelection(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock)
      .toHaveFetched(expectedUrl, {
        headers: {'Content-Type': 'application/json'},
        body: {rego: expectedRego, rego_modules: {'example.rego': regoFile1}}
      });
  });

  test('eopa.preview.setToken sets the token secret', async () => {
    const expectedSecret = 'secret';

    const env = getTestEnv();
    const storeSecretSpy = jest.spyOn(env.secrets, 'store');
    vscode.window.showInputBox = jest.fn().mockResolvedValueOnce(expectedSecret);

    await eopaPreview.runSetToken(env.args);

    expect(storeSecretSpy).lastCalledWith('authToken', expectedSecret);
  });

  test.each([
    ['json', '{"data": true}'],
    ['yaml', 'data: true'],
  ])('finds %p input next to the current file', async (fileType: string, contents: string) => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();

    vscode.Uri.file = jest.fn().mockImplementation((path: string) => mockUri(path));
    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    env.fs.readFile.mockImplementation((uri) => {
      switch (basename(uri.path)) {
        case `input.${fileType}`:
          return Promise.resolve(Buffer.from(contents));
        case 'example.rego':
          return Promise.resolve(Buffer.from(regoFile1));
        default:
          throw new FileError(new Error('unknown file'), uri.path);
      }
    });
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {input: {data: true}, rego_modules: {'example.rego': regoFile1}},
    });
  });

  test.each([
    ['/example/path/nested/input.json', '{"data": true}'],
    ['/example/path/nested/input.yaml', 'data: true'],
    ['/example/path/input.json', '{"data": true}'],
    ['/example/path/input.yaml', 'data: true'],
  ])('finds %p input file at the workspace root', async (inputPath: string, contents: string) => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv({editor: {document: {fileName: '/example/path/nested/example.rego', languageId: 'rego', lineCount: 1, uri: {fsPath: '/example/path/nested/example.rego'}}}});
    const folder = mock<vscode.WorkspaceFolder>({uri: mockUri('/example/path')});
    env.args.workspace = [folder];
    env.args.settings.roots = ['/example/path'];

    vscode.Uri.file = jest.fn().mockImplementation((path: string) => mockUri(path));
    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.fs.stat.mockImplementation((uri: vscode.Uri) => {
      if (uri.path !== inputPath) {
        throw new Error('file not found');
      }
      return Promise.resolve(mock<vscode.FileStat>());
    });
    env.fs.readDirectory.mockResolvedValueOnce([['nested', vscode.FileType.Directory]]).mockResolvedValueOnce([['example.rego', vscode.FileType.File]]);
    env.fs.readFile.mockImplementation((uri) => {
      switch (uri.path) {
        case inputPath:
          return Promise.resolve(Buffer.from(contents));
        case '/example/path/nested/example.rego':
          return Promise.resolve(Buffer.from(regoFile1));
        default:
          throw new FileError(new Error('unknown file'), uri.path);
      }
    });
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {input: {data: true}, rego_modules: {'nested/example.rego': regoFile1}},
    });
  });

  test('collect files when run in a workspace', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();
    const folder = mock<vscode.WorkspaceFolder>({uri: mockUri('/example/path')});
    env.args.workspace = [folder];
    env.args.settings.roots = ['/example/path'];
    env.args.settings.prefix = 'prefix/test';

    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.fs.stat.mockImplementation(() => {
      throw new Error('input file does not exist');
    });
    env.fs.readDirectory
      .mockResolvedValueOnce([['example.rego', vscode.FileType.File], ['nested', vscode.FileType.Directory]])
      .mockResolvedValue([['existing.rego', vscode.FileType.File], ['ignored.js', vscode.FileType.File]]);
    env.fs.readFile.mockResolvedValueOnce(Buffer.from(regoFile1)).mockResolvedValueOnce(Buffer.from(regoFile2));
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {rego_modules: {'prefix/test/example.rego': regoFile1, 'prefix/test/nested/existing.rego': regoFile2}},
    });
  });

  test('only includes the current file when run in file mode', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();
    const folder = mock<vscode.WorkspaceFolder>({uri: mockUri('/example/path')});
    env.args.workspace = [folder];
    env.args.settings.roots = ['/example/path'];
    env.args.settings.strategy = 'file';

    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    env.fs.stat.mockImplementation(() => {
      throw new Error('input file does not exist');
    });
    env.fs.readDirectory
      .mockResolvedValueOnce([['example.rego', vscode.FileType.File], ['nested', vscode.FileType.Directory]])
      .mockResolvedValue([['existing.rego', vscode.FileType.File], ['ignored.js', vscode.FileType.File]]);
    env.fs.readFile.mockResolvedValueOnce(Buffer.from(regoFile1)).mockResolvedValueOnce(Buffer.from(regoFile2));
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {rego_modules: {'example.rego': regoFile1}},
    });
  });

  test('does not include ignored files when run in a workspace', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();
    const folder = mock<vscode.WorkspaceFolder>({uri: mockUri('/example/path')});
    env.args.workspace = [folder];
    env.args.settings.roots = ['/example/path'];
    env.args.settings.ignores = ['**/existing.rego'];

    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.fs.stat.mockImplementation(() => {
      throw new Error('input file does not exist');
    });
    env.fs.readDirectory
      .mockResolvedValueOnce([['example.rego', vscode.FileType.File], ['nested', vscode.FileType.Directory]])
      .mockResolvedValue([['existing.rego', vscode.FileType.File], ['ignored.js', vscode.FileType.File]]);
    env.fs.readFile.mockResolvedValueOnce(Buffer.from(regoFile1));
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {rego_modules: {'example.rego': regoFile1}},
    });
  });

  test('collect data when run in a workspace', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();
    const folder = mock<vscode.WorkspaceFolder>({uri: mockUri('/example/path')});
    env.args.workspace = [folder];
    env.args.settings.roots = ['/example/path'];

    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.fs.stat.mockImplementation(() => {
      throw new Error('input file does not exist');
    });
    env.fs.readDirectory
      .mockResolvedValueOnce([['example.rego', vscode.FileType.File], ['data1', vscode.FileType.Directory], ['data2', vscode.FileType.Directory]])
      .mockResolvedValueOnce([['data.json', vscode.FileType.File]])
      .mockResolvedValueOnce([['nested', vscode.FileType.Directory]])
      .mockResolvedValueOnce([['data.yaml', vscode.FileType.File]]);
    env.fs.readFile
      .mockResolvedValueOnce(Buffer.from(regoFile1))
      .mockResolvedValueOnce(Buffer.from(JSON.stringify({hasData: true, nestedData: {foo: 'bar'}})))
      .mockResolvedValueOnce(Buffer.from('hasData: true'));
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {
        data: {data1: {hasData: true, nestedData: {foo: 'bar'}}, data2: {nested: {hasData: true}}},
        rego_modules: {'example.rego': regoFile1}
      },
    });
  });

  test.each([
    'instrument',
    'print',
    'provenance',
    'sandbox',
    'strict',
    'strict-builtin-errors'
  ])('sends option %p when set', async (arg: string) => {
    const expectedUrl = `http://example.com/v0/preview/test?${arg}=true`;
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();
    env.args.settings.options = [arg as PreviewOption];

    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {'Content-Type': 'application/json'},
      body: {rego_modules: {'example.rego': regoFile1}},
    });
  });

  test('sends bearer token authorization header when set', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};

    const env = getTestEnv();
    env.args.settings.authType = 'bearer';

    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    env.secrets.get.mockResolvedValue('secret');
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had the expected parameters
    expect(fetchMock).toHaveFetched(expectedUrl, {
      headers: {Authorization: 'Bearer secret', 'Content-Type': 'application/json'},
      body: {rego_modules: {'example.rego': regoFile1}},
    });
  });

  test('sets up a TLS agent when TLS auth is configured', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};
    const expectedCert = 'Cert PEM file';
    const expectedKey = 'Key PEM file';

    const env = getTestEnv();
    env.args.settings.authType = 'tls';
    env.args.settings.clientCert = 'clientCert.pem';
    env.args.settings.clientKey = 'clientKey.pem';
    env.args.settings.allowUnauthorized = true;

    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    env.fs.stat.mockImplementation(() => {
      throw new Error('input file does not exist');
    });
    env.fs.readFile.mockImplementation((uri) => {
      switch (uri.path) {
        case 'clientCert.pem':
          return Promise.resolve(Buffer.from(expectedCert));
        case 'clientKey.pem':
          return Promise.resolve(Buffer.from(expectedKey));
        default:
          throw new FileError(new Error('unknown file'), uri.path);
      }
    });
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had an agent defined
    // Note -- pulling out the call like this is not ideal, but the API does not provide a method for easily checking
    // the Agent setting, so this works around it.
    const call = (fetchMock as unknown as {_calls: [{options: {agent: Agent}}]})._calls[0];
    const agent = call?.options?.agent;
    if (agent === undefined) {
      console.log(call); // eslint-disable-line no-console
      throw new Error('fetchMock call agent is undefined');
    }
    expect(agent).toBeInstanceOf(Agent);
    expect(agent.options.cert).toBe(expectedCert);
    expect(agent.options.key).toBe(expectedKey);
    expect(agent.options.rejectUnauthorized).toBeFalsy();
  });

  test('sets up a TLS agent when a custom CA is configured', async () => {
    const expectedUrl = 'http://example.com/v0/preview/test';
    const expectedResult = {result: {hello: 'world'}};
    const expectedCACert = 'CA PEM file';

    const env = getTestEnv();
    env.args.settings.ca = 'ca.pem';

    vscode.Uri.parse = jest.fn().mockImplementation((path: string) => mockUri(path));
    env.editor.document.lineAt.mockReturnValue(mock<vscode.TextLine>({text: 'package test', isEmptyOrWhitespace: false, firstNonWhitespaceCharacterIndex: 0}));
    env.editor.document.getText.mockReturnValue(regoFile1);
    env.fs.stat.mockImplementation(() => {
      throw new Error('input file does not exist');
    });
    env.fs.readFile.mockImplementation((uri) => {
      switch (uri.path) {
        case 'ca.pem':
          return Promise.resolve(Buffer.from(expectedCACert));
        default:
          throw new FileError(new Error('unknown file'), uri.path);
      }
    });
    fetchMock.post(expectedUrl, expectedResult);

    await eopaPreview.runPreviewPackage(env.args);

    // Make sure no errors were reported, and if they were, expose them as a test failure.
    if (env.reportedErrors.mock.calls.length > 0) {
      throw env.reportedErrors.mock.calls[0][0];
    }
    // Check the expected results were reported
    expect(env.reportedResult).lastCalledWith(utils.formatResults(expectedResult), expect.anything());
    // Check the http call had an agent defined
    // Note -- pulling out the call like this is not ideal, but the API does not provide a method for easily checking
    // the Agent setting, so this works around it.
    const call = (fetchMock as unknown as {_calls: [{options: {agent: Agent}}]})._calls[0];
    const agent = call?.options?.agent;
    if (agent === undefined) {
      console.log(call); // eslint-disable-line no-console
      throw new Error('fetchMock call agent is undefined');
    }
    expect(agent).toBeInstanceOf(Agent);
    expect(agent.options.ca).toBe(expectedCACert);
    expect(agent.options.rejectUnauthorized).toBeTruthy();
  });
});

function getTestEnv(mockArgs: { fs?: object, secrets?: object, editor?: object } = {editor: {document: {fileName: '/example/path/example.rego', languageId: 'rego', lineCount: 1, uri: {fsPath: '/example/path/example.rego'}}}}): {
  reportedErrors: jest.SpyInstance
  reportedResult: jest.SpyInstance
  fs: _MockProxy<vscode.FileSystem> & vscode.FileSystem
  secrets: _MockProxy<vscode.SecretStorage> & vscode.SecretStorage
  editor: _DeepMockProxy<vscode.TextEditor> & vscode.TextEditor
  args: utils.PreviewEnvironment
} {
  const reportedErrors = jest.spyOn(utils, 'reportError');
  const reportedResult = jest.spyOn(utils, 'reportResult');
  const mockFS = mock<vscode.FileSystem>(mockArgs.fs);
  const mockSecrets = mock<vscode.SecretStorage>(mockArgs.secrets);
  const mockEditor = mockDeep<vscode.TextEditor>(mockArgs.editor);

  const args: utils.PreviewEnvironment = {
    settings: {
      url: 'http://example.com',
      defaultQuery: '',
      roots: [],
      prefix: '',
      options: [],
      strategy: 'all',
      ignores: [],
      ca: '',
      allowUnauthorized: false,
      authType: 'none',
      clientCert: '',
      clientKey: '',
    },
    fs: mockFS,
    editor: mockEditor,
    window: undefined,
    workspace: undefined,
    secrets: mockSecrets,
  };

  return {
    reportedErrors,
    reportedResult,
    fs: mockFS,
    secrets: mockSecrets,
    editor: mockEditor,
    args
  };
}

function mockUri(path: string): _MockProxy<vscode.Uri> & vscode.Uri {
  const m = mock<vscode.Uri>({scheme: 'file', path});
  m.with.mockImplementation((change: { scheme?: string | undefined; authority?: string | undefined; path?: string | undefined; query?: string | undefined; fragment?: string | undefined; }): vscode.Uri => {
    if (change?.path) {
      if (change.path.startsWith('file:/')) {
        change.path = change.path.substring('file:/'.length);
      }
      return mockUri(change.path);
    }
    return m;
  });
  return m;
}
