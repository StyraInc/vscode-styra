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
  diagnosticLimit?: number;
  checkUpdateInterval?: number;
}

// defaults should match contributes.configuration.properties from package.json
const defaultSettingMockOptions: SettingMockOptions = {
  outputFormat: 'table',
  diagnosticOutput: false,
  diagnosticLimit: 120,
  checkUpdateInterval: 1
};

export function mockVSCodeSettings(options: SettingMockOptions = defaultSettingMockOptions): jest.Mock {
  return jest.fn().mockImplementation(
    (path, key) => {
      switch (key) {
        case Setting.Format:
          return options.outputFormat;
        case Setting.Diagnostic:
          return options.diagnosticOutput;
        case Setting.DiagnosticLimit:
          return options.diagnosticLimit;
        case Setting.UpdateInterval:
          return options.checkUpdateInterval;
      }
    });
}
