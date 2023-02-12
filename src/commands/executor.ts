import {checkStartup} from '../lib/utility';
import {CommandNotifier} from '../lib/command-notifier';
import {ICommand, ReturnValue} from '../lib/types';
import {infoFromUserAction, teeError} from '../lib/outputPane';

export class Executor {

  static async run(command: ICommand): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier(command.title);
    notifier.markStart();

    try {
      const result = await command.run();
      if (result === ReturnValue.Terminated) {
        infoFromUserAction(`${command.title} terminated`);
      } else {
        notifier.markHappyFinish();
      }
    } catch ({message}) {
      teeError(message as string);
      notifier.markSadFinish();
    }
  }

}
