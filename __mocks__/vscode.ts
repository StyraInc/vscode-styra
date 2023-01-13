/* eslint-disable no-undef */

class Channel {
  append = (s: string) => s;
  appendLine = (s: string) => s;
}

const window = {
  createOutputChannel: jest.fn(() => new Channel()),
  createStatusBarItem: jest.fn(() => ({
    show: jest.fn()
  })),
  showErrorMessage: jest.fn(),
  showInformationMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  createTextEditorDecorationType: jest.fn()
};

const vscode = {
  window,
};

module.exports = vscode;
