# Developer Notes

## Adding a New Command

| File | Action |
| ---- | ------ |
| /README.md | Add one-line command (`name`, `description`) to `## Features` section. |
| /README.md | Add any new VSCode settings to `## Extension Settings` section if needed. |
| /package.json | Add command object (`name`, `key`) to `contributes.commands` section. |
| src/extension.ts | Add `key` and new command object "new Link`<Cmd>`()" to `styraCommands`. |
| src/commands/Link`<Cmd>`.ts | Implement the command in this new file using the template below.
| src/lib/vscode-api.ts | Add any new needed vscode API calls in this conduit file. |
| src/commands/utility.ts | Add any new common helper functions here. |

### Template for new command

Start your new command with this template.
Replace all instances of `<Cmd>` with your command name.

``` typescript
import { checkStartup } from './utility';
import { ICommand } from '../lib/types';
import { infoNewCmd } from '../lib/outputPane';

export class Link<Cmd> implements ICommand {
  async run(): Promise<void> {

    infoNewCmd('Link <Cmd>');
    if (!(await checkStartup())) {
      return;
    }
  }
}
```
