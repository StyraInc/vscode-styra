# Developer Notes

## Adding a New Command

| File | Action |
| ---- | ------ |
| /README.md | Add one-line command (`name`, `description`) to `## Features` section. |
| /README.md | Add any new VSCode settings to `## Extension Settings` section if needed. |
| /CHANGELOG.md | Add to (or create) an `### Added` section and mention the new command. |
| /package.json | Add command object (`name`, `key`) to `contributes.commands` section. |
| src/extension.ts | Add `key` and new command object "new Link`<CMD>`()" to `styraCommands`. |
| src/commands/Link`<CMD>`.ts | Implement the command in this new file using the template below.
| src/lib/vscode-api.ts | Add any new needed vscode API calls in this conduit file. |
| src/commands/utility.ts | Add any new common helper functions here. |

### Template for new command

Start your new command with this template.  You will need to:

1. Replace all instances of `<CMD>` with your command name.
2. Replace `<OTHER_PARAMS>` with necessary params.
3. Replace `<CODE>` with whatever you need to prepare <OTHER_PARAMS>.

``` typescript
import { checkStartup } from './utility';
import { CommandNotifier } from '../lib/command-notifier';
import { CommandRunner } from '../lib/command-runner';
import { ICommand } from '../lib/types';
import { info } from '../lib/outputPane';

export class Link<CMD> implements ICommand {
  async run(): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier('Link <CMD>');
    notifier.markStart();

    try {
      <CODE>...
      const result = await new CommandRunner().runStyraCmd(['link', <OTHER_PARAMS>...])
      info(result);
      notifier.markHappyFinish();
    } catch {
      notifier.markSadFinish();
    }
 
  }
}
```
