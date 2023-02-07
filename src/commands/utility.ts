import {infoFromUserAction, outputChannel} from '../lib/outputPane';
import {LocalStorageService, Workspace} from '../lib/local-storage-service';
import {MultiStepInput} from '../external/multi-step-input';
import {QuickPickItem} from '../lib/vscode-api';
import {StyraConfig} from '../lib/styra-config';
import {StyraInstall} from '../lib/styra-install';

export type StepType = (input: MultiStepInput) => Promise<StepType | void>;

export function generatePickList(items: string[]): QuickPickItem[] {
  return items.map((label) => ({label}));
}

export function shouldResume(): Promise<boolean> {
  // Could show a notification with the option to resume.
  return new Promise<boolean>((_resolve, _reject) => {

    const cmd = LocalStorageService.instance.getValue<string>(Workspace.CmdName);
    infoFromUserAction(`Escape pressed: ${cmd} terminated`);
  });
}

export async function validateNoop(_value: string): Promise<string | undefined> {
  return undefined;
}

export async function validateNonEmpty(value: string): Promise<string | undefined> {
  return value.trim().length > 0 ? undefined : 'must be non-empty';
}

// TODO: be quiet about the output on subsequent runs...?
export async function checkStartup(): Promise<boolean> {

  outputChannel.show(true);

  if (!StyraInstall.checkWorkspace()) {
    return false;
  }
  if (!(await StyraInstall.checkCliInstallation())) {
    return false;
  }
  if (!(await StyraConfig.checkCliConfiguration())) {
    return false;
  }
  await StyraInstall.checkForUpdates();
  return true;
}
