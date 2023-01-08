import { QuickPickItem } from 'vscode';

export function generatePickList(items: string[]): QuickPickItem[] {
  return items.map((label) => ({ label }));
}

export function shouldResume(): Promise<boolean> {
  // Could show a notification with the option to resume.
  return new Promise<boolean>((_resolve, _reject) => {
    // noop
  });
}

export async function validateNoop(_value: string): Promise<string | undefined> {
  return undefined;
}
