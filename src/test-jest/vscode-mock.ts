/* eslint-disable @typescript-eslint/naming-convention */

// Adapted from template kindly provided by the folks at WallabyJS
jest.mock('vscode',
  () => {
    class Channel {
      clear = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
      show = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
      append = (s: string) => s;
      appendLine = (s: string) => s;
    }

    class EventEmitter {
      fire = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function
    }

    return {
      Disposable: jest.fn(),
      window: {
        showInformationMessage: jest.fn(),
        showErrorMessage: jest.fn(),
        showWarningMessage: jest.fn(),
        createOutputChannel: jest.fn().mockImplementation(() => new Channel())
      },
      workspace: {
        getConfiguration: jest.fn(),
        workspaceFolders: ['my_root'],
      },
      commands: {
        executeCommand: jest.fn()
      },
      Uri: {
        parse: jest.fn().mockImplementation((url) => url),
        file: jest.fn().mockImplementation((url) => url)
      },
      FileType: {
        File: 0,
        Directory: 1,
      },
      EventEmitter,
      Range: jest.fn().mockImplementation(() => ({})),
      CodeLens: jest.fn().mockImplementation(() => ({})),
      env: {
      }
    };
  },
  {virtual: true}
);
