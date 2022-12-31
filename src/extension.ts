import * as vscode from "vscode";
import * as fs from "fs";
import { default as fetch, Request } from "node-fetch";
import cp = require("child_process");
import { sync as commandExistsSync } from "command-exists";

import { CONFIG_FILE_PATH, StyraConfig } from "./lib/styra-config";
import { System } from "./lib/types";
import { StyraInstall } from "./lib/styra-install";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "vscode-styra" is now active!');

  context.subscriptions.push(
    vscode.commands.registerCommand("styra.log.replay", () => {
      runLogReplay();
    })
  );
}

async function runLogReplay() {
  console.log("this is a call to the logReplay function");

  const styraPath = vscode.workspace
    .getConfiguration("styra")
    .get<string>("path");
  const existsOnPath = commandExistsSync("styra");
  const existsInUserSettings =
    styraPath !== undefined && styraPath !== null && fs.existsSync(styraPath);
  const isInstalled = existsOnPath || existsInUserSettings;

  if (isInstalled) {
    console.log("Styra CLI is already installed");
  } else {
    console.log("Styra CLI is not installed");
    const continueRun = await StyraInstall.promptForInstall();
    if (!continueRun) { return; }
  }

  console.log("calling config");
  await configureStyra();
  console.log("back from config");

  console.log("calling readConfig");
  const configData = await StyraConfig.read();
  console.log(`back from config: url = ${configData.url}`);
  const request = new Request(`${configData.url}/v1/systems?compact=true`, {
    method: "GET",
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "Content-Type": "application/json",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Authorization: `Bearer ${configData.token}`,
    },
  });
  const response = await fetch(request);
  response.json().then((json) => {
    const systems = json.result as System[];
    if (systems?.length > 0) {
      const systemNames = systems.map((system) => "   " + system.name);
      systemNames.unshift("Select System:");
      vscode.window.showQuickPick(systemNames).then((systemName) => {
        if (systemName === undefined || systemName === "Select System:") {
          return;
        } else {
          // guaranteed to find one since we picked from the list so eslint exception OK!
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const systemId = systems.find(
            (system) => system.name === systemName.trim()
          )!.id;
          runLogReplayForSystem(systemId);
        }
      });
    } else if (systems) {
    vscode.window.showWarningMessage(
      `Failed to read from ${configData.url}: unauthorized (check your token permissions)`);
    } else {
    vscode.window.showWarningMessage(
      `Failed to read from ${configData.url}: invalid token`);
    }
  }).catch((reason) => {
    // non-existent (or hibernated) system will trigger this path
    vscode.window.showWarningMessage(
      `Failed to read from ${configData.url}: ${reason.message}`);
  });
}

async function runLogReplayForSystem(systemId: string) {
  console.log(`running log replay for system: ${systemId}`);
  // run the styra command with the systemId and the policy from the active vscode window
  // TODO: handle no-open-editor more gracefully.
  const policiesFile = vscode.window.activeTextEditor!.document.uri.fsPath;
  parse(
    "opa",
    policiesFile,
    (pkg: string, _imports: string[]) => {
      const styraCommand = "styra";
      const styraArgs = [
        "validate",
        "logreplay",
        "--system",
        systemId,
        "--policies",
        `${pkg}=${policiesFile}`,
        "-o",
        "json",
      ];
      console.log(
        "the running command would be:" + styraCommand + " " + styraArgs
      );
      run(styraCommand, styraArgs, "", (error: string, result: any) => {
        console.log("This is the callback from the styra cli run.");
        console.log(result);
        const samples = result.samples.length;
        const resultChanged = result.stats.results_changed;
        const entriesEvaluated = result.stats.entries_evaluated;
        vscode.window.showInformationMessage(
          `${samples} samples / ${resultChanged} changed / ${entriesEvaluated} replayed `
        );
      });
    },
    (error: string) => {
      const errorObj = JSON.parse(error);
      vscode.window.showErrorMessage(
        `parsing ${policiesFile.split('/').at(-1)} failed: ${errorObj.errors?.[0]?.message ?? '??'}`);
    }
  );
}


async function configureStyra() {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    console.log("Styra CLI already configured");
    vscode.window.showInformationMessage(`Using existing Styra CLI configuration (${CONFIG_FILE_PATH})`);
  } else {
    const dasURL = await vscode.window.showInputBox({ title: "Styra DAS URL" });
    if (!dasURL || !dasURL.trim()) {
      vscode.window.showWarningMessage('Config cancelled due to no input');
      return;
    }
    const token = await vscode.window.showInputBox({ title: "Styra DAS API token" });
    if (!token || !token.trim()) {
      vscode.window.showWarningMessage('Config cancelled due to no input');
      return;
    }
    console.log("Configuring the Styra CLI");
    vscode.window.showInformationMessage("Configuring Styra CLI.");
    run(
      "styra",
      ["configure", "--url", dasURL, "--access-token", token],
      "",
      (error: string, result: any) => {
        console.log(result);
        vscode.window.showInformationMessage("Styra CLI configured.");
      }
    );
  }
}

function parse(
  opaPath: string,
  path: string,
  cb: (pkg: string, imports: string[]) => void,
  onerror: (output: string) => void
) {
  run(
    opaPath,
    ["parse", path, "--format", "json"],
    "",
    (error: string, result: any) => {
      if (error !== "") {
        onerror(error);
      } else {
        const pkg = getPackage(result);
        const imports = getImports(result);
        cb(pkg, imports);
      }
    }
  );
}

// run executes the OPA binary at path with args and stdin.  The callback is
// invoked with an error message on failure or JSON object on success.
function run(
  path: string,
  args: string[],
  stdin: string,
  cb: (error: string, result: any) => void
) {
  runWithStatus(
    path,
    args,
    stdin,
    (code: number, stderr: string, stdout: string) => {
      if (code !== 0) {
        if (stdout !== "") {
          cb(stdout, "");
        } else {
          cb(stderr, "");
        }
      } else {
        cb("", JSON.parse(stdout));
      }
    }
  );
}

// runWithStatus executes the OPA binary at path with args and stdin. The
// callback is invoked with the exit status, stderr, and stdout buffers.
function runWithStatus(
  path: string,
  args: string[],
  stdin: string,
  cb: (code: number, stderr: string, stdout: string) => void
) {
  console.log("spawn:", path, "args:", args.toString());

  const proc = cp.spawn(path, args);

  proc.stdin.write(stdin);
  proc.stdin.end();
  let stdout = "";
  let stderr = "";

  proc.stdout.on("data", (data) => {
    stdout += data;
  });

  proc.stderr.on("data", (data) => {
    stderr += data;
  });

  proc.on("exit", (code, _signal) => {
    console.log("code:", code);
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);
    cb(code!, stderr, stdout);
  });
}

function getPackage(parsed: any): string {
  return getPathString(parsed["package"].path.slice(1));
}

function getImports(parsed: any): string[] {
  if (parsed.imports !== undefined) {
    return parsed.imports.map((x: any) => {
      const str = getPathString(x.path.value);
      if (!x.alias) {
        return str;
      }
      return str + " as " + x.alias;
    });
  }
  return [];
}

function getPathString(path: any): string {
  let i = -1;
  return path
    .map((x: any) => {
      i++;
      if (i === 0) {
        return x.value;
      } else {
        if (x.value.match("^[a-zA-Z_][a-zA-Z_0-9]*$")) {
          return "." + x.value;
        }
        return '["' + x.value + '"]';
      }
    })
    .join("");
}
