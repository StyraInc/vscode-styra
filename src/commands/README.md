# Developer Notes

## General Notes

### Unit Tests

The project boilerplate provides unit tests in a vscode-hosted container of sorts (see /src/tests);
however, those tests are not being used nor developed.
Instead conventional unit tests are actively developed and used in CI with the Jest framework;
this provides the additional advantage of being supported by wallabyJS, the continuous-testing runner.

On the command-line, you can run Jest tests in a few ways (per scripts in package.json):

- npm run test — run once and terminate; detail only failed tests.
- npm run test:verbose — run once and terminate; detail all tests.
- npm run test:watch — run and stay alive; rerunning when you save files.

## Preparing a Release

1. Add release to top of /CHANGELOG.md, following "Keep a Changelog" conventions.
2. Add release tag to bottom of /CHANGELOG.md, to make the title a hyperlink to a version diff.
3. Update version in package.json.
4. Run `npm run package`.
5. Create a new release in GitHub [Releases](https://github.com/StyraInc/vscode-styra/releases) page.
6. Upload package (`vscode-styra-n.n.n.vsix`) to the release; once we publish to VSCode marketplace, this will change.
7. Post notice of release in `#proj-link` channel.

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

  title = 'Styra Link <CMD>';
  /* if you need to collect input uncomment-and customize-this block:
  totalSteps = <NUM>;
  flow = `
  CREATE DIAGRAM AT https://asciiflow.com/#/
  `;
  */

  async run(): Promise<void> {

    if (!(await checkStartup())) {
      return;
    }
    const notifier = new CommandNotifier(this.title);
    notifier.markStart();

    /* uncomment if you need to collect input */
    // const state = await this.collectInputs();

    const styraArgs = [
      'link',
      // customize as needed (including `state` object if input collected)
      <OTHER_PARAMS>. . .
    ];
    */

    try {
      const result = await new CommandRunner().runStyraCmd(styraArgs)
      info(result);
      notifier.markHappyFinish();
    } catch {
      notifier.markSadFinish();
    }
 
  }

  /* if you need to collect input uncomment-and customize-this block:
  private async collectInputs(): Promise<State> {
    infoDiagram(this.title, this.flow);
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.YOUR_FIRST_STEP_HERE(input, state));
    return state as State;
  } 

  private async YOUR_FIRST_STEP_HERE(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    . . .
  } 

  . . .

  private async YOUR_LAST_STEP_HERE(input: MultiStepInput, state: Partial<State>): Promise<void> {
    . . .
  } 
  */

}
```
