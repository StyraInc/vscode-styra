import {checkStartup} from '../lib/utility';
import {CommandNotifier} from '../lib/command-notifier';
import {ICommand} from '../lib/types';

export class Executor {

  static async run(command: ICommand): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier(command.title);
    notifier.markStart();

    await command.run(notifier);
  }

}
