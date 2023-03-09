# The Styra VSCode Extension

## Where to go

- What users see as the extension home page inside VS Code -> /README.md.
- Notes for developers (debugging, adding new Link commands, preparing a release, running unit tests, etc.) -> /src/README.md.
- How to test, evaluate, and generally do a "quality review" of this project -> right here!

## Doing a Quality Review

Setup: Download and install the extension from the project [Releases](https://github.com/StyraInc/vscode-styra/releases) page (it is not yet published to the VSCode marketplace).

Review as much as you can, of course, but here is a list of key items with some points to consider (not exhaustive, of course!).

### Extension Home page in VS Code

Where: `VS Code > Extensions > Styra`

- should give the user thorough but concise info on Styra DAS, Styra Link, the extension
- should itemize available commands
- should itemize available VS Code settings

### Changelog

Where: [changelog](https://github.com/StyraInc/vscode-styra/blob/main/CHANGELOG.md)

- should surface USER FACING details in each release
- each release title should be hyperlinked to show a list of commits in that release

### Startup flow

When you invoke any Styra Link command in VS Code it first runs a substantial analysis of your environment.
Refer to the detailed flow diagram at the top of the [developer notes](https://github.com/StyraInc/vscode-styra/blob/main/src/README.md).
Try to exercise as many of the paths as you can.
Some of these paths require setup, of course. Here are a few suggestions:

#### Force a new CLI version to be found

Adjust the STYRA_CLI_RELEASE_VERSION in fetchdb:/Makefile to an earlier version.
Run `make styra-cli-bin`.
Copy the generated `build/styra` to /usr/local/bin.
Now you will be running that earlier version, so the current version will be considered "new".

#### Force a CLI configuration failure

Supply an invalid tenant URL; this will generate one type of error.
Supply an invalid token; this will generate a different type of error.

#### To finagle whether the check interval has passed

Adjust the VS Code setting `Styra > Check Update Interval`.
Set it to 0 means it will always check.
Set it to non-zero means the second time you run it on any given day it will skip the check.

### Running Commands

Because Styra DAS is hard, we try to provide guidance to the user.
Observe that when you run commands the Styra output pane provides tips on some inputs
and even flow diagrams on multi-step commands so the user can know what is in store.
Is the information provided sufficient? Is it useful?

Because they are many moving parts (DAS, your files, and VS Code), there are many non-happy paths
you should try as well. The list of these would be voluminous, but here are a few ideas to get you started:

- Try the `Styra Link: Configure Git` command before `Styra Link: Initialize`.
- After a successful run of `Styra Link: Initialize`, try `Styra Link: Initialize` again.
- During configuration you had to provide a valid DAS token; but now, edit your ~/.styra/config and try an invalid token.
- Try `Styra Link: Initialize` with the "connect to existing system" option. If you have, say, an existing envoy system, see what happens if you "mistakenly" tell it you have a kubernetes system type.

...As you are exercising, please add to this list!
