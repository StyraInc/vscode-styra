import { info, teeInfo } from './outputPane';


export class CommandNotifier {

  name: string;

  constructor(name: string) {
    this.name = name;
  }

  // Use this at the start of the ICommand:run() method for every command.
  markStart(): void {
    info('');
    info('--------------------------------------------------------------------------');
    // TODO: use https://www.npmjs.com/package/vscode-read-manifest to read commands
    info(`Running Command: ${this.name}`);
    info(`** You will see "${this.name} completed" (or "failed") when this is done.`);
    info('--------------------------------------------------------------------------');

    // TODO: set a status flag here that can be checked with a "Styra Link: status" command.
  }

  // Conclude a command with these next two methods at appropriate points.

  markHappyFinish(): void {
    teeInfo(`====> ${this.name} completed`);
  }

  markSadFinish(): void {
    // err already displayed so not emitting (with tee) again here
    info(`====> ${this.name} failed`);
  }
}