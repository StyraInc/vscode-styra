import {outputChannel} from '../lib/output-pane';

export class OutputPaneSpy {
  private spyAppendLine = jest.spyOn(outputChannel, 'appendLine');
  private spyAppend = jest.spyOn(outputChannel, 'append');

  get content(): string {
    return this.spyAppendLine.mock.calls.join(',') +
      this.spyAppend.mock.calls.join(',');
  }
}

export function mockType(mock: unknown): jest.Mock {
  return mock as unknown as jest.Mock;
}

export function mockVSCodeSettings(format = 'table'): jest.Mock {
  return jest.fn().mockImplementation(
    (path, key) => {
      switch (key) {
        case 'outputFormat':
          return format;
        case 'diagnosticOutput':
          return true;
      }
    });
}
