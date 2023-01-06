/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

// TODO: should we care about this cmd, remove the above eslint overrides and resolve the issues.

import * as vscode from 'vscode';
import { default as fetch, Request } from 'node-fetch';

import { StyraConfig } from '../lib/styra-config';
import { ICommand, System } from '../lib/types';
import { StyraInstall, STYRA_CLI_CMD } from '../lib/styra-install';
import { CommandRunner } from '../lib/command-runner';
import { info, infoFromUserAction, infoNewCmd  } from '../lib/outputPane';

export class LogReplay implements ICommand {

  async run(): Promise<void> {
    infoNewCmd('Log Replay');

    if (!await StyraInstall.checkCliInstallation()) {
      return;
    }

    if (!await StyraConfig.checkCliConfiguration()) {
      return;
    }

    const configData = await StyraConfig.read();
    const request = new Request(`${configData.url}/v1/systems?compact=true`, {
      method: 'GET',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${configData.token}`,
      },
    });
    info('Fetching DAS systems list...');
    const response = await fetch(request);
    response
      .json()
      .then((json) => {
        const systems = json.result as System[];
        if (systems?.length > 0) {
          const systemNames = systems.map((system) => '   ' + system.name);
          systemNames.unshift('Select System:');
          vscode.window.showQuickPick(systemNames).then((systemName) => {
            if (systemName === undefined || systemName === 'Select System:') {
              infoFromUserAction('log-replay cancelled due to no selection');
              return;
            } else {
              // guaranteed to find one since we picked from the list so eslint exception OK!
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const systemId = systems.find(
                (system) => system.name === systemName.trim()
              )!.id;
              this.runLogReplayForSystem(systemId);
            }
          });
        } else if (systems) {
          vscode.window.showWarningMessage(
            `Failed to read from ${configData.url}: unauthorized (check your token permissions)`
          );
        } else {
          vscode.window.showWarningMessage(
            `Failed to read from ${configData.url}: invalid token`
          );
        }
      })
      .catch((reason) => {
        // non-existent (or hibernated) system will trigger this path
        vscode.window.showWarningMessage(
          `Failed to read from ${configData.url}: ${reason.message}`
        );
      });
  }

  async runLogReplayForSystem(systemId: string): Promise<void> {
    console.log(`running log replay for system: ${systemId}`);
    // run the styra command with the systemId and the policy from the active vscode window
    // TODO: handle no-open-editor more gracefully.
    const policiesFile = vscode.window.activeTextEditor!.document.uri.fsPath;
    const runner = new CommandRunner();
    this.parse(
      'opa',
      policiesFile,
      async (pkg: string, _imports: string[]) => {
        const styraArgs = [
          'validate',
          'logreplay',
          '--system',
          systemId,
          '--policies',
          `${pkg}=${policiesFile}`,
          '-o',
          'json',
        ];
        console.log(
          'the running command would be:' + STYRA_CLI_CMD + ' ' + styraArgs
        );
        const result = JSON.parse(await runner.runShellCmd(STYRA_CLI_CMD, styraArgs));
        console.log(result);
        const samples = result.samples.length;
        const resultChanged = result.stats.results_changed;
        const entriesEvaluated = result.stats.entries_evaluated;
        vscode.window.showInformationMessage(
          `${samples} samples / ${resultChanged} changed / ${entriesEvaluated} replayed `
        );
      },
      (error: string) => {
        const errorObj = JSON.parse(error);
        vscode.window.showErrorMessage(
          `parsing ${policiesFile.split('/').at(-1)} failed: ${
            errorObj.errors?.[0]?.message ?? '??'
          }`
        );
      }
    );
  }

  async parse(
    opaPath: string,
    path: string,
    cb: (pkg: string, imports: string[]) => void,
    onerror: (output: string) => void
  ): Promise<void> {
    try {
      const result = JSON.parse(
        await new CommandRunner().runShellCmd(opaPath, [
          'parse',
          path,
          '--format',
          'json',
        ])
      );
      const pkg = this.getPackage(result);
      const imports = this.getImports(result);
      cb(pkg, imports);
    } catch (err) {
      onerror(err as string);
    }
  }

  getPackage(parsed: any): string {
    return this.getPathString(parsed['package'].path.slice(1));
  }

  getImports(parsed: any): string[] {
    if (parsed.imports !== undefined) {
      return parsed.imports.map((x: any) => {
        const str = this.getPathString(x.path.value);
        if (!x.alias) {
          return str;
        }
        return str + ' as ' + x.alias;
      });
    }
    return [];
  }

  getPathString(path: any): string {
    let i = -1;
    return path
      .map((x: any) => {
        i++;
        if (i === 0) {
          return x.value;
        } else {
          if (x.value.match('^[a-zA-Z_][a-zA-Z_0-9]*$')) {
            return '.' + x.value;
          }
          return '["' + x.value + '"]';
        }
      })
      .join('');
  }
}
