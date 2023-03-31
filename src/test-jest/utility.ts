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

type SettingMockOptions = {
  outputFormat?: string;
  diagnosticOutput?: boolean;
}

const defaultSettingMockOptions = {outputFormat: 'table', diagnosticOutput: true};
export function mockVSCodeSettings(options: SettingMockOptions = defaultSettingMockOptions): jest.Mock {
  return jest.fn().mockImplementation(
    (path, key) => {
      switch (key) {
        case 'outputFormat':
          return options.outputFormat;
        case 'diagnosticOutput':
          return options.diagnosticOutput;
      }
    });
}
