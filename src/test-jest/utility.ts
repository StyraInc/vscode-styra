import {outputChannel} from '../lib/output-pane';
import {Setting} from '../lib/ide-settings';

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
  checkUpdateInterval?: number;
}

const defaultSettingMockOptions: SettingMockOptions = {
  outputFormat: 'table',
  diagnosticOutput: false,
  checkUpdateInterval: 0
};

export function mockVSCodeSettings(options: SettingMockOptions = defaultSettingMockOptions): jest.Mock {
  return jest.fn().mockImplementation(
    (path, key) => {
      switch (key) {
        case Setting.Format:
          return options.outputFormat;
        case Setting.Diagnostic:
          return options.diagnosticOutput;
        case Setting.UpdateInterval:
          return options.checkUpdateInterval;
      }
    });
}
