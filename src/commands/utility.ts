import { QuickPickItem } from 'vscode';

import { MultiStepInput } from '../external/multi-step-input';
import { StyraConfig } from '../lib/styra-config';
import { StyraInstall } from '../lib/styra-install';

export type StepType = (input: MultiStepInput) => Promise<StepType | void>;

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

export async function validateNonEmpty(value: string): Promise<string | undefined> {
  return value.length > 0 ? undefined : 'must be non-empty';
}

export async function checkStartup(): Promise<boolean> {

  if (!StyraInstall.checkWorkspace()) {
    return false;
  }
  if (!(await StyraInstall.checkCliInstallation())) {
    return false;
  }
  if (!(await StyraConfig.checkCliConfiguration())) {
    return false;
  }
  return true;
}
