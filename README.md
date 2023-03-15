# Styra DAS for Visual Studio Code

**Styra Link** is a new way of working with [Styra DAS](https://www.styra.com/styra-das/).
It allows you to create a new Styra DAS system or connect with an existing one.
Once connected you can write, test, validate, and publish policy all within your normal development workflow.
If you prefer the command line, that is where Styra Link started.
But now, this extension also brings the capabilities of Styra Link right into VSCode to streamline your workflow!

## Commands

Some of the commands execute immediately but those with a trailing ellipsis ask you to enter several inputs.
Be on the lookout! When you see the footnote indicator next to the prompt `(*) See output pane (*)` look
for the latest footnote in the Styra output pane to provide further context on what you need to supply.

* `Styra Link: Initialize...` — create (or connect to) a system in DAS.
* `Styra Link: Configure Git...` — configure Styra Link with a Git connection.
* `Styra Link: Test` — run your unit tests using the latest authored policies.
* `Styra Link: Validate Decisions` — replay prior decisions against your latest authored polices to see how decisions will change.
* `Styra Link: Search...` — find available library rules for the current Styra Link project.

## Editing Rego Files

Rego is the authorization language of [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/), or "OPA" for short.
This extension provides syntax highlighting for rego files.
In addition, we provide a wealth of ready-made policy snippets to jump start your rego journey.
Note that whether you have any snippets depends on the system type of the DAS system
that you have connected to your currently loaded VSCode project with Styra Link.
For example, there are over 120 snippets defined for Kubernetes systems.

In addition to the policy snippets, which vary based on the system type,
there are a few general language snippets as well to aid you in getting up to speed with rego.
All of these start with "rego" as the trigger, so just type that into a rego file and you will see a list of them.

## Requirements

* [Styra CLI](https://docs.styra.com/reference/cli/install-use-cli) executable (`styra`) must be installed on your `$PATH`.  If you do not have Styra CLI installed, the plugin will prompt you to install it when you run any command. Supports Windows, Mac, and Linux systems.
* A [Styra DAS](https://www.styra.com/styra-das/) tenant; you can get one for free at our [Sign-up page](https://signup.styra.com); the VSCode plugin will check for this when you run any command; if not found, it will offer to take you to the same URL so you can get one. It only takes a moment!

## Extension Settings

| Setting | Default | Description |
| --- | --- | --- |
| `Styra > Check Update Interval` | 1 | How often to check for updates to the Styra CLI (in days). |
| `Styra > Debug` | false | Reveal diagnostic details (including API calls) in the Styra output pane. |

## Known Issues

None
