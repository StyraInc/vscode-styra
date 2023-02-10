import {checkStartup} from '../lib/utility';
import {CommandNotifier} from '../lib/command-notifier';
import {CommandRunner} from '../lib/command-runner';
import {ICommand} from '../lib/types';
import {info} from '../lib/outputPane';

export class LinkTest implements ICommand {

  title = 'Styra Link Test';

  async run(): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier(this.title);
    notifier.markStart();

    try {
      const result = await new CommandRunner().runStyraCmd(['link', 'test']);
      info(result);
      notifier.markHappyFinish();
    } catch {
      notifier.markSadFinish();
    }
  }
}
