# vscode-styra Visual Studio Code Extension

Brings the capabilities of Styra Link into VSCode for streamlining your workflow!

## Features

* `Styra Link: Initialize` — create (or connect to) a system in DAS.
* `Styra Link: Config Git` — configure Styra Link with a Git connection.
* `Styra Link: Test` — run your unit tests using the latest authored policies.
* `Styra Link: Validate Decisions` — replay prior decisions against your latest authored polices to see how decisions will change.
* `Styra Link: Search` — find available library rules for the current Styra Link project.

## Requirements

* [Styra CLI](https://docs.styra.com/reference/cli/install-use-cli) executable (`styra`) must be installed on your `$PATH`.  If you do not have Styra CLI installed, the plugin will prompt you to install it when you run any command.
* A [Styra DAS](https://www.styra.com/styra-das/) tenant; you can get one for free at <https://signup.styra.com>; the VSCode plugin will check for this when you run any command; if not found, it will offer to take you to the same URL so you can get one. It only takes a moment!

## Extension Settings

| Setting | Default | Description |
| --- | --- | --- |
| `Styra > Check Update Interval` | 1 | How often to check for updates to the Styra CLI (in days). |

## Known Issues

N/A
