import {ICommand, ReturnValue} from '../lib/types';
import {info, infoFromUserAction, outputChannel, teeError} from '../lib/output-pane';
import {LocalStorageService, Workspace} from '../lib/local-storage-service';
import {StyraConfig} from '../lib/styra-config';
import {StyraInstall} from '../lib/styra-install';

export class Executor {

  static StorageManager = LocalStorageService.instance;

  static async run(command: ICommand): Promise<void> {

    if (!(await this.checkStartup())) {
      return;
    }
    this.StorageManager.setValue(Workspace.CmdName, command.title);
    this.announce(command.title);

    try {
      const result = await command.run();
      if (result === ReturnValue.TerminatedByUser) {
        infoFromUserAction(`${command.title} terminated`);
      } else {
        info(`====> ${command.title} completed`);
      }
    } catch ({message}) {
      teeError(message as string);
      info(`====> ${command.title} failed`);
    }
    this.StorageManager.setValue<string>(Workspace.CmdName, '');
  }

  // TODO: be quiet about the output on subsequent runs...?
  static async checkStartup(): Promise<boolean> {

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

  static announce(name: string): void {
    info('');
    info('--------------------------------------------------------------------------');
    // TODO: use https://www.npmjs.com/package/vscode-read-manifest to read commands
    info(`Running Command: ${name}`);
    info(`** You will see "${name} completed" (or "failed") when this is done.`);
    info('--------------------------------------------------------------------------');
  }

}
