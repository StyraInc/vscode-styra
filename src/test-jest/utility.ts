import {outputChannel} from '../lib/output-pane';
import {Setting, settingDefaults} from '../lib/ide-settings';

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

export function mockVSCodeSettings(options: SettingMockOptions = {}): jest.Mock {
  return jest.fn().mockImplementation(
    (_path, key: string) => {
      switch (key) {
        case Setting.Format:
          return options.outputFormat ?? settingDefaults[key];
        case Setting.Diagnostic:
          return options.diagnosticOutput ?? settingDefaults[key];
        case Setting.DiagnosticLimit:
          return options.diagnosticLimit ?? settingDefaults[key];
        case Setting.UpdateInterval:
          return options.checkUpdateInterval ?? settingDefaults[key];
      }
    });
}
