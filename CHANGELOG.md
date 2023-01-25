# Change Log

All notable changes to the "vscode-styra" extension will be documented in this file.

<!-- markdownlint-disable MD024 -->
## [Unreleased]

## [0.0.3-alpha] - 2023-01-24

### Added

- `Styra Link: Validate Decisions` initial release.
- Long-running commands provide progress notification.

### Fixed

- Suppress display of passwords/passphrases
- A couple input steps were not instrumented to remain open upon loss of focus.

## [0.0.2-alpha] - 2023-01-18

### Added

- `Styra Link: Test` initial release.
- Unit test infrastructure added.
- Unit test PR gating check added.
- API seam for VSCode, allowing for ease of adding other IDEs down the road.
- Internal "readme" describing how to add new commands.

### Fixed

- While going through a multi-step dialog (`styra link init` or `styra link config git`), moving focus to another window then returning now keeps the dialog open.

## [0.0.1-alpha] - 2023-01-10

### Added

- `Styra Link: Init` initial release.
- `Styra Link: Config Git` initial release.
