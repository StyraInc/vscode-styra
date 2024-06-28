# Contributing

Thanks for your interest in contributing to the Styra VSCode project!

All contributions to this project must be in [TypeScript](https://www.typescriptlang.org/) and should be accompanied by unit tests.

## New Contributors

To get an overview of the project, read both the public-facing [README](https://github.com/StyraInc/vscode-styra) and the more detailed documentation at [our docs site](https://docs.styra.com/das/reference/vs-code-extension/).

Once you are familiar with the project, follow these steps to get going:

1. [Fork the repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo)
1. [Clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) your fork.
1. Install Node JS if you do not already have it installed and run `npm install`
1. Make your changes and write unit tests
1. [Push your changes](https://github.com/git-guides/git-push) to a branch
1. Create a [pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)

Once you pull request has been reviewed and accepted, your changes are merged and will go out when the next release is cut!

## Debugging

You can debug this extension within VSCode

1. Open this project in VSCode.
2. In the "Run and Debug" pane, choose the `Run Extension` mode from the dropdown at the top.
3. Launch (via either the "Start Debugging" button adjacent to that mode selector or via F5).

What you should see:

1. The standard debug toolbar will pop-up giving you controls for stepping, pausing, etc.
2. In the Terminal window you should see a new task launched: `npm esbuild-watch` with some nominal output.
3. A new VSCode window opens ("Extension Development Host").

The Styra extension in the new window acts almost exactly as if you had installed it through normal means, with a couple exceptions:
(a) You will not find it listed in the "Extensions" pane (unless you previously installed it like a normal extension!).
(b) Since VSCode is built with Electron, you can open the same DevTools panel in VSCode that you are familiar with from Chrome!
Use `Help > Toggle Developer Tools` or the shortcut `⌥ + ⌘ + I`.

Get friendly with the `Console` tab of the Developer Tools.
Just like in Chrome, any `console.log` statements in your code will emit there—NOT to the standard VSCode "Debug Console"!
Also any exceptions that your code throws will appear there.

While you will find local storage and session storage under the Developer Tools "Application" tab just like Chrome,
that is NOT where VSCode local storage persists.
Rather it is stored via the Memento API (see <https://stackoverflow.com/a/51822055>).
You can use the VSCode "Memento Explorer" extension to view and modify that local storage. See extension.ts for details.

## Unit Tests

The project boilerplate provides unit tests in a vscode-hosted container of sorts (see /src/tests);
however, those tests are not being used nor developed.
Instead, conventional unit tests are actively developed and used in CI with the Jest framework;
this provides the additional advantage of being supported by wallabyJS, the continuous-testing runner.

On the command-line, you can run Jest tests in a few ways (per scripts in package.json):

- npm run test — run once and terminate; detail only failed tests.
- npm run test:verbose — run once and terminate; detail all tests.
- npm run test:watch — run and stay alive; rerunning when you save files.

Within VSCode, you could use the `vscode-jest` extension, but it seems to have problems.
It runs the entire test suite OK, but then reports "Jest process "watch-tests" ended unexpectedly",
so the watcher capability is somehow broken. This further causes the Test Explorer to be broken,
showing only one line for the suite (no subtree of tests at all).

A better choice is the `vscode-jest-runner` extension, that runs only on demand and does not use
the Test Explorer. But it works, allowing both running AND debugging tests!

## Preparing a Release

1. CHANGELOG.md: Add release to top of file, following "Keep a Changelog" conventions.
2. CHANGELOG.md: Add release tag to bottom of file, to make the title a hyperlink to a version diff.
3. CHANGELOG.md: Update release tag at bottom for `unreleased`.
4. README.md: Run `npm test` which has a by-product of updating the code coverage badge stored in this file.
5. .vscodeignore: After you build the VSIX package, review its contents (it is just a zip file), then come back here and add exclusionary items, as appropriate (then rebuild the VSIX again).

## Publish to VSCode marketplace

Usually you just run `npx --yes @vscode/vsce publish minor`. The last arg may also be `major` or `patch`, as appropriate.
Any of those choices will auto-increment your version number.
You may also provide a fixed, specific version number if desired.
That takes a minute or so to bundle and ship a new package off to the VSCode marketplace.
Once it finishes locally, the VSCode marketplace then takes several minutes to validate it
before it makes it live on their site.
You can monitor the progress under [Manage Publishers & Extensions](https://marketplace.visualstudio.com/manage/publishers/styra).
Contact our ops team to get a login of the form `your-name@platformstyra.onmicrosoft.com`.

This `vsce publish` command:

- records the new version number in package.json and package-lock.json
- adds a local commit with these version updates
- generates a matching version git tag

Final steps:

- The created tag is now on the branch, though, and we want it on main. So delete it with, e.g., `git tag -d v1.2.0`.
- Create a pull request with the above changes (CHANGELOG, README, .vscodeignore, and package*.json). Title should be "release: n.n.n" and description should be "Bookkeeping for release n.n.n.".
- Merge that PR to main, then on main recreate the tag, e.g.:
  `git tag -a v1.2.0 -m "release 1.2.0"`
- Push the new tag to github (example: `git push origin v1.2.0`)
- Go to https://github.com/StyraInc/vscode-styra/releases and draft a new release (e.g. name here would be "V1.2.0").
- Post notice of the release in the `#proj-link` channel.
- Post notice of the release in the Styra Community Slack, `#vscode` channel.

## Package for testing/code review only

To generate a build for testing and code review (i.e. a build before going public):

1. Update `version n.n.n` in package.json to bump the version
   (I typically bump just the `patch` octet)
   and add a `-next.0` suffix (or `-next.1`, `-next.2`, etc., as you iterate during the review).
   The `major.minor.patch` _must_ be higher than the latest released version;
   otherwise, VS Code will NOT install your local version
   (even though it WILL show your new version number. Aargh!)
   So if you have released `25.14.7`, use `25.14.8-next.0` for your new release candidate.
2. Run `npm run package`.
3. Provide the resultant package (`vscode-styra-n.n.n-next.N.vsix`) to interested parties
   by editing the latest release (e.g. `https://github.com/StyraInc/vscode-styra/releases/tag/v25.14.7`)
   and attaching the package there.

## Adding Commands for Styra Link

| File | Action |
| ---- | ------ |
| /README.md | Add one-line command (`name`, `description`) to `## Commands` section. |
| /README.md | Add any new VSCode settings to `## Extension Settings` section if needed. |
| package.json | Also add new VSCode settings to `contributes.configuration.properties` section. |
| /CHANGELOG.md | Add to (or create) an `### Added` section and mention the new command. |
| /package.json | Add command object (`name`, `key`) to `contributes.commands` section. |
| src/extension.ts | Add `key` and new command object "new Link`<CMD>`()" to `styraCommands`. |
| src/commands/Link`<CMD>`.ts | Implement the command in this new file using the template below.
| src/lib/vscode-api.ts | Add any new needed vscode API calls in this conduit file. |
| src/commands/utility.ts | Add any new common helper functions here. |

(Yes, there is complete duplication of the settings in README.md and package.json,
but I think it is worth it. The package.json settings are required by VSCode.
But those only appear on the extension home page within VS Studio if you go to
the Features >> Settings tab. Also putting them in the README makes them
easily accessible viewing the home page of the repo.)

Whenever you run a Styra Link command, before it even thinks about running a command, it goes through this startup protocol.

![startup flow diagram](https://github.com/StyraInc/vscode-styra/blob/main/image/startup-flow.png)

### Template for new command

Start your new command with this template.  You will need to:

1. Replace all instances of `<CMD>` with your command name.
2. Replace `<OTHER_PARAMS>` with necessary params.
3. Replace other ALL_CAPITAL items as appropriate.

``` typescript
import { CommandRunner } from '../lib/command-runner';
import {ICommand, ReturnValue} from '../lib/types';
import { info } from '../lib/outputPane';

export class Link<CMD> implements ICommand {

  title = 'Styra Link <CMD>';
  /* if you need to collect input uncomment-and customize-this block:
  totalSteps = <NUM>;
  flow = `
  CREATE DIAGRAM AT https://asciiflow.com/#/
  `;
  */

  async run(): Promise<ReturnValue> {

    /* uncomment if you need to collect input */
    // const state = await this.collectInputs();

    const styraArgs = [
      'link',
      // customize as needed (including `state` object if input collected)
      <OTHER_PARAMS>. . .
    ];
    */

    const result = await new CommandRunner().runStyraCmd(styraArgs)
    info(result);
    return ReturnValue.Completed;
  }

  /* if you need to collect input uncomment-and customize-this block:
  private async collectInputs(): Promise<State> {
    infoDiagram(this.title, this.flow);
    const state = {} as Partial<State>;
    await MultiStepInput.run((input) => this.YOUR_FIRST_STEP_HERE(input, state));
    return state as State;
  } 

  // step function names should be `pick...` if you are enumerating a set of choices
  // or `input...` if you are providing a text box for typed input.
  // Each step EXCEPT the final one returns `Promise<StepType>`;
  // the final step returns `Promise<void>` and has NO return statement

  private async YOUR_FIRST_STEP_HERE(input: MultiStepInput, state: Partial<State>): Promise<StepType> {
    . . .
    return (input: MultiStepInput) => this.YOUR_NEXT_STEP_HERE(input, state);
  } 

  . . .

  private async YOUR_LAST_STEP_HERE(input: MultiStepInput, state: Partial<State>): Promise<void> {
    . . .
  } 
  */

}
```

## Snippets

There are two types of snippets:

**Rego example snippets** are available independent of system type.
Simply typing "rego" inside any rego file will pop-up VSCode intellisense with a list of all the rego examples.
These snippets are stored in `snippets/styra-common.yaml` for ease of editing.
If stored as JSON, you would have to worry about quotes surrounding each line,
as well as escaping embedded quotes (which occurs a lot in these examples!).
However, VSCode needs them to be in JSON rather than YAML, so after you make changes
to `snippets/styra-common.yaml` run `npm run snippets:build:common` to regenerate
the `snippets/styra-common.json` file that will be used by VSCode.

DO NOT edit `snippets/styra-common.json` directly!

The diagram shows the key pieces of a snippet definition.

![snippet parts](https://github.com/StyraInc/vscode-styra/blob/main/image/rego-snippet.png)

1. The trigger phrase
2. The short description
3. The long description
4. Inserted description (that is, this item, and all below, are pasted into the editor)
5. Documentation link
6. Package/import header that allows the code block to execute in the playground.
7. Sample data, surrounded by START/END comments for clarity.
8. Code, with annotations as necessary.

**Policy snippets** are system-type-specific and should be stored in the snippets directory
with a name that matches the system type (e.g., snippets/kubernetes.json).
When editing a rego file (in a kubernetes project only, following the same example),
VSCode intellisense will trigger when you type, e.g. "add".

## Documentation

* [Styra DAS introduction](https://docs.styra.com/das/)
* [Styra extension for VS Code](https://docs.styra.com/das/reference/vs-code-extension/)
* [Styra Link](https://docs.styra.com/das/reference/styra-link/)
