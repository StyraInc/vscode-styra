# vscode-styra Visual Studio Code Extension

Brings the capabilities of Styra Link into VSCode for streamlining your workflow!

## Features

* `Styra Link: Initialize` — create (or connect to) a system in DAS.
* `Styra Link: Config Git` — configure Styra Link with a Git connection.
* `Styra Link: Test` — run your unit tests using the latest authored policies.
* `Styra Link: Validate Decisions` — replay prior decisions against your latest authored polices to see how decisions will change.

## Requirements

* This plugin requires the [Styra CLI](https://docs.styra.com/reference/cli/install-use-cli) executable (`styra`) to be installed in your `$PATH`. Alternatively, you can configure the `styra.path` setting in VSCode to point to the executable. If you do not have Styra CLI installed, the plugin will prompt you to install it when you run the initialization command.

## Extension Settings

| Field | Default | Description |
| --- | --- | --- |
| `styra.path` | `null` | Set path of the Styra CLI executable (if not on your `$PATH`). If the path contains the string `${workspaceFolder}` it will be replaced with the current workspace root. E.g., if the path is set to `${workspaceFolder}/bin/styra` and the current workspace root is `/home/alice/project`, the executable path will resolve to `/home/alice/project/bin/styra`. |

## Known Issues

N/A
