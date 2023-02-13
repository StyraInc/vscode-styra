import {checkStartup} from '../lib/utility';
import {ICommand, ReturnValue} from '../lib/types';
import {info, infoFromUserAction, teeError} from '../lib/outputPane';
import {LocalStorageService, Workspace} from '../lib/local-storage-service';

export class Executor {

  static StorageManager = LocalStorageService.instance;

  static async run(command: ICommand): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    this.StorageManager.setValue(Workspace.CmdName, command.title);
    this.announce(command.title);

    try {
      const result = await command.run();
      if (result === ReturnValue.Terminated) {
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

  static announce(name: string): void {
    info('');
    info('--------------------------------------------------------------------------');
    // TODO: use https://www.npmjs.com/package/vscode-read-manifest to read commands
    info(`Running Command: ${name}`);
    info(`** You will see "${name} completed" (or "failed") when this is done.`);
    info('--------------------------------------------------------------------------');
  }

}
