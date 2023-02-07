import {outputChannel} from '../lib/outputPane';

export class OutputPaneSpy {
  private spyAppendLine = jest.spyOn(outputChannel, 'appendLine');

  get content(): string {
    return this.spyAppendLine.mock.calls.join(',');
  }
}
