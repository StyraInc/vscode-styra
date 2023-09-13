<!-- markdownlint-disable MD041 -->
[![slack](https://img.shields.io/badge/slack-styra-24b6e0.svg?logo=slack)](https://styracommunity.slack.com/)
[![Apache License](https://img.shields.io/badge/license-Apache%202.0-orange.svg)](https://www.apache.org/licenses/LICENSE-2.0)
[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/Styra.vscode-styra?color=24b6e0)](#)
[![Coverage](https://img.shields.io/badge/Coverage-74%25-brightgreen)](#)
[![CI status](https://github.com/StyraInc/vscode-styra/actions/workflows/main.yaml/badge.svg)](https://github.com/StyraInc/vscode-styra/actions/workflows/main.yaml)
[![closed PRs](https://img.shields.io/github/issues-pr-closed-raw/StyraInc/vscode-styra)](https://github.com/StyraInc/vscode-styra/pulls?q=is%3Apr+is%3Aclosed)
<!--
  Notes for above:
  24b6e0 is Styra blue!
  Slack: https://github.com/brigadecore/brigade-foundations/pull/17/files
  CI status: https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge
-->

# Styra VS Code Tools

If you are using products from [Styra](https://www.styra.com), the creators of Open Policy Agent, to help you streamline and scale your authorization needs, then you need Styra VS Code Tools. This extension integrates features from Styra products directly with your VS Code editor.

## Enterprise OPA: Preview

Ever wanted to know what impact your policy changes will have on your existing deployment without needing to deploy them? With the Enterprise OPA preview feature, you can see what decision will be made in the context of your live policy agent, all without effecting the current decisions it is making. With Styra VS Code Tools, you can run previews directly from VS Code using single-click Code Lens support, right-click contextual menus in Rego files, or via the command palette.

### Commands

* `Enterprise OPA: Preview` - Preview the default query with any locally authored updates
* `Enterprise OPA: Preview Package` - Preview the package of the current file with any locally authored updates
* `Enterprise OPA: Preview Selection` - Preview the currently selected text with any locally authored updates
* `Enterprise OPA: Set Token` - Store the bearer token as a secret for use when authorizing Enterprise OPA preview requests


### Settings

| Setting | Default | Description |
| --- | --- | --- |
| `Opa > Roots` | [${workspaceFolder}] | Bundle roots to search when looking for Rego policies and data (inherited from the [Open Policy Agent extension](https://marketplace.visualstudio.com/items?itemName=tsandall.opa)). |
| `Eopa > Url` | http://localhost:8181 | The URL where the Enterprise OPA HTTP API is accessible. |
| `Eopa > Preview > Default&nbsp;Query` | | The default query to run when performing an **Enterprise OPA: Preview**. |
| `Eopa > Preview > Prefix` | | A prefix to add to all policy paths when mapping for Enterprise OPA preview.  |
| `Eopa > Preview > Arguments` | [] | Controls the behavior and features of Enterprise OPA preview calls. |
| `Eopa > Preview > Strategy` | all | Determine which files to map for Enterprise OPA preview calls. |
| `Eopa > Preview > Ignore` | [] | A set of glob patterns to omit when mapping for Enterprise OPA preview calls. |
| `Eopa > Preview > Code Lense` | true | Enable or disable support for Enterprise OPA preview Code Lens. |
| `Eopa > Auth > Type` | none | Determine what kind of authorization to use when connecting to the Enterprise OPA API |
| `Eopa > Auth > Client Cert Pem` | | A file path to a PEM encoded client certificate used for TLS authentication. |
 `Eopa > Auth > Client Key Pem` | | A file path to a PEM encoded client key used for TLS authentication. |
| `Eopa > Auth > Client Cert CA` | | A file path to a PEM encoded custom certificate authority certificate to trust when connecting to Enterprise OPA. |
| `Eopa > Auth > Allow Unauthorized TLS` | false | Whether or not to trust Enterprise OPA when the returned TLS certificate is from an unknown authority. |
## Styra DAS: Link

[Styra Link](https://docs.styra.com/das/reference/styra-link/) is an opinionated workflow for managing Styra DAS. You can write, test, validate, and publish policy all within your normal development workflow. Styra VS Code Tools brings the capabilities of Styra Link right into VS Code, streamlining your policy authoring process even further.

### Commands

Some of these commands execute immediately but those with a trailing ellipsis ask you to enter several inputs. When you see the footnote indicator next to the prompt `(*) See output pane (*)` look for the latest footnote in the Styra output pane to provide further context on what you need to supply.

* `Styra Link: Bundle Update...` — update the local bundle with any current changes.
* `Styra Link: Configure Git...` — configure Styra Link with a Git connection.
* `Styra Link: Initialize...` — create (or connect to) a system in DAS.
* `Styra Link: Search...` — find available library rules for the current Styra Link project.
* `Styra Link: Test` — run your unit tests using the latest authored policies.
* `Styra Link: Validate Compliance` — check for compliance violations against your latest authored polices for supported systems.
* `Styra Link: Validate Decisions` — replay prior decisions against your latest authored polices to see how decisions will change.

### Settings

| Setting | Default | Description |
| --- | --- | --- |
| `Styra > Check Update Interval` | 1 | How often to check for updates to the Styra CLI (in days). |
| `Styra > Diagnostic Limit` | 120 | Length limit of diagnostic output (use -1 for no limit). |
| `Styra > Diagnostic Output` | false | Reveal API calls and other diagnostic details in the output pane. |
| `Styra > Output Format` | table | Selects the output format for commands that return data. |

### Requirements

* [Styra CLI](https://docs.styra.com/reference/cli/install-use-cli) executable (`styra`) must be installed on your `$PATH`.  If you do not have Styra CLI installed, the plugin will prompt you to install it when you run any Styra Link command.
* A [Styra DAS](https://www.styra.com/styra-das/) tenant; you can get one for free at our [Sign-up page](https://signup.styra.com); the VSCode plugin will check for this when you run any command; if not found, it will offer to take you to the same URL so you can get one. It only takes a moment!

## Rego Snippets

New to Rego? Styra VS Code Tools provides a wealth of ready-made policy snippets to jump start your Rego journey. Our general language snippets as well to aid you in getting up to speed with rego. All of these start with "rego" as the trigger, so just type that into a rego file and you will see a list of them.

In addition to the general snippets, Styra VS Code Tools contains over 120 snippets defined for the Styra DAS Kubernetes system type.
