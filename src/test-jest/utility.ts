import {outputChannel} from '../lib/outputPane';

export class OutputPaneSpy {
  private spyAppendLine = jest.spyOn(outputChannel, 'appendLine');

  get content(): string {
    return this.spyAppendLine.mock.calls.join(',');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mockType(mock: unknown): jest.MockInstance<any, any> {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mock as unknown as jest.MockInstance<any, any>;
}
