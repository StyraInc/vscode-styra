import { info, teeInfo } from './outputPane';


export class CommandNotifier {

  name: string;

  constructor(name: string) {
    this.name = name;
  }

  // Use this at the start of the ICommand:run() method for every command.
  infoNewCmd(): void {
    info('');
    info('------------------------------------------------------');
    // TODO: use https://www.npmjs.com/package/vscode-read-manifest to read commands
    info(`Running Command: ${this.name}`);
    info('------------------------------------------------------');
  }

  infoCmdSucceeded(): void {
    teeInfo(`====> ${this.name} complete`);
  }

  infoCmdFailed(): void {
    info(`====> ${this.name} failed`); // err already displayed so not emitting (with tee) again here
  }
}
