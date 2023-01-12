/* eslint-disable @typescript-eslint/naming-convention */

// Adapted from template kindly provided by the folks at WallabyJS
jest.mock('vscode',
  () => {
    class Channel {
      append = (s: string) => s;
      appendLine = (s: string) => s;
    }

    return {
      Disposable: jest.fn(),
      window: {
        showInformationMessage: jest.fn(),
        createOutputChannel: jest.fn().mockImplementation(() => new Channel())
      },
      commands: {
        executeCommand: jest.fn()
      },
      Uri: {
        parse: jest.fn().mockImplementation(url => url)
      },
      env: {
      }
    };
  },
  { virtual: true }
);
