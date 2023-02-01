import {info, teeInfo} from './outputPane';
import {LocalStorageService, Workspace} from './local-storage-service';

export class CommandNotifier {

  private name: string;
  private storageManager = LocalStorageService.instance;

  constructor(name: string) {
    this.name = name;
  }

  // Use this at the start of the ICommand:run() method for every command.
  markStart(): void {
    this.storageManager.setValue(Workspace.CmdName, this.name);
    info('');
    info('--------------------------------------------------------------------------');
    // TODO: use https://www.npmjs.com/package/vscode-read-manifest to read commands
    info(`Running Command: ${this.name}`);
    info(`** You will see "${this.name} completed" (or "failed") when this is done.`);
    info('--------------------------------------------------------------------------');
  }

  // Conclude a command with these next two methods at appropriate points.

  markHappyFinish(): void {
    this.storageManager.setValue<string>(Workspace.CmdName, '');
    teeInfo(`====> ${this.name} completed`);
  }

  markSadFinish(): void {
    this.storageManager.setValue<string>(Workspace.CmdName, '');
    // err already displayed so not emitting (with tee) again here
    info(`====> ${this.name} failed`);
  }
}
