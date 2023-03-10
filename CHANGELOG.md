# Change Log

All notable changes to the "vscode-styra" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

<!-- markdownlint-disable MD024 -->

## [Unreleased]

### Added

- Policy snippets are now system-type specific.
- Added assortment of rego language snippets for any system type.

## [0.0.6-alpha] - 2023-02-17

### Added

- During startup checks, if the Styra CLI is not yet configured, we add a new peremptory question asking if the user has a DAS tenant. If not, offer to take the user to the sign-up page.
- Surface the global `--debug` option from the Styra Link CLI, letting the user see the API calls in the Styra output pane. There is a new boolean VSCode setting `Styra > Debug` that controls the visibility of this.

### Fixed

- Adjusted command names that require user inputs to include a trailing ellipsis to give a visual indicator to the user before running the command.
- Because of the physical separation of user prompts and messages in the output pane, improved the visibility indicating such "footnotes".

### Removed

- `styra.path` removed from VSCode settings, as it still needed more work and is non-vital at this stage.

## [0.0.5-alpha] - 2023-02-13

### Added

- Support for creating projects of Terraform or Custom type.
- Commands now check for newer CLI version periodically and allow user to update with a click. Interval between checks is configurable from 0 to 30 days.
- Any time you initiate a Styra Link command, the Styra output pane will immediately be brought to the foreground.
- When installing the CLI, the plugin now shows an active progress bar for the duration rather than just a one-time (vanishing) notification.

### Fixed

- The workflow for `Styra Link: Config Git` was awkward/confusing with respect to the "overwrite" question at the end of the dialog. Now the system first checks
whether there is anything to overwrite, then asks that first, mirroring the CLI flow.

## [0.0.4-alpha] - 2023-02-01

### Added

- `Styra Link: Snippets Search` command added.
- Syntax highlighting for rego files.
- Intellisense in rego files to provide snippets (Kubernetes only).

### Removed

- `Styra: Log Replay` command removed (covered by `Styra Link: Validate Decisions`)

### Fixed

- Can now use `Styra Link: Initialize` with an existing DAS system; previously had to always create a new DAS system.

## [0.0.3-alpha] - 2023-01-24

### Added

- `Styra Link: Validate Decisions` command added.
- Long-running commands provide progress notification.

### Fixed

- Suppress display of passwords/passphrases
- A couple input steps were not instrumented to remain open upon loss of focus.

## [0.0.2-alpha] - 2023-01-18

### Added

- `Styra Link: Test` command added.
- Unit test infrastructure added.
- Unit test PR gating check added.
- API seam for VSCode, allowing for ease of adding other IDEs down the road.
- Internal "readme" describing how to add new commands.

### Fixed

- While going through a multi-step dialog (`styra link init` or `styra link config git`), moving focus to another window then returning now keeps the dialog open.

## [0.0.1-alpha] - 2023-01-10

### Added

- `Styra Link: Init` command added.
- `Styra Link: Config Git` command added.

<!-- Be sure to add an entry here for each release! -->
[unreleased]: https://github.com/StyraInc/vscode-styra/compare/v0.0.6-alpha...HEAD
[0.0.6-alpha]: https://github.com/StyraInc/vscode-styra/compare/v0.0.5-alpha...v0.0.6-alpha
[0.0.5-alpha]: https://github.com/StyraInc/vscode-styra/compare/v0.0.4-alpha...v0.0.5-alpha
[0.0.4-alpha]: https://github.com/StyraInc/vscode-styra/compare/v0.0.3-alpha...v0.0.4-alpha
[0.0.3-alpha]: https://github.com/StyraInc/vscode-styra/compare/v0.0.2-alpha...v0.0.3-alpha
[0.0.2-alpha]: https://github.com/StyraInc/vscode-styra/compare/v0.0.1-alpha...v0.0.2-alpha
[0.0.1-alpha]: https://github.com/StyraInc/vscode-styra/releases/tag/v0.0.1-alpha
