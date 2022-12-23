// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as fs from "fs";
import * as os from "os";
import * as fse from "fs-extra";
import { default as fetch, Request } from "node-fetch";
import cp = require("child_process");
const commandExistsSync = require("command-exists").sync;
const moveFile = require("move-file");

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

  // if the Styra CLI is not installed, prompt the user to install it
  if (!(existsOnPath || existsInUserSettings)) {
    console.log("Styra CLI is not installed");
    promptForInstall();
    return;
  } else {
    console.log("Styra CLI is installed");
    configureStyra();
  }

  const dasURL = vscode.workspace.getConfiguration("styra").get<string>("url");
  const token = vscode.workspace.getConfiguration("styra").get<string>("token");
  const request = new Request(`${dasURL}/v1/systems?compact=true`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const response = await fetch(request);
  response.json().then((json) => {
    console.log(json.result);
    const systems = json.result;
    const systemNames = systems.map((system: any) => "   " + system.name);
    systemNames.unshift("Select System:");
    vscode.window.showQuickPick(systemNames).then((systemName) => {
      if (systemName === undefined || systemName === "Select System:") {
        return;
      } else {
        const systemId = systems.find(
          (system: any) => system.name === systemName.trim()
        ).id;
        runLogReplayForSystem(systemId); // TODO: do something with result?
      }
    });
  });
}

async function runLogReplayForSystem(systemId: string) {
  console.log(`running log replay for system: ${systemId}`);
  // run the styra command with the systemId and the policy from the active vscode window
  const policiesDir = vscode.window.activeTextEditor!.document.uri.fsPath;
  parse(
    "opa",
    policiesDir,
    (pkg: string, _imports: string[]) => {
      const styraCommand = "styra";
      const styraArgs = [
        "validate",
        "logreplay",
        "--system",
        systemId,
        "--policies",
        `${pkg}=${policiesDir}`,
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
      console.log(error);
    }
  );
}

function promptForInstall() {
  vscode.window
    .showInformationMessage(
      "Styra CLI is not installed. Would you like to install it now?",
      "Install",
      "Cancel"
    )
    .then((selection) => {
      if (selection === "Install") {
        console.log("installing Styra CLI");
        installStyra();
      } else {
        console.log("cancelling Styra CLI install");
      }
    });
}

async function installStyra() {
  vscode.window.showInformationMessage(
    "Installing Styra CLI. This may take a few minutes."
  );

  const targetOS = process.platform;
  // Setup url based on the targetOS
  const url =
    targetOS === "win32"
      ? `https://docs.styra.com/v1/docs/bin/windows/amd64/styra.exe`
      : targetOS === "darwin"
      ? `https://docs.styra.com/v1/docs/bin/darwin/amd64/styra`
      : `https://docs.styra.com/v1/docs/bin/linux/amd64/styra`;
  const binaryFile =
    targetOS === "win32"
      ? "styra.exe"
      : targetOS === "darwin"
      ? "styra"
      : "styra";
  const tempFileLocation = os.homedir() + "/" + binaryFile;
  const response = await fetch(url);
  const writeStream = fse.createWriteStream(tempFileLocation);
  response.body.pipe(writeStream);
  writeStream.on("finish", () => {
    console.log("Styra CLI installed");
    fs.chmodSync(tempFileLocation, "755");
    targetOS === "win32"
      ? moveFile(tempFileLocation, "C:\\Program Files\\styra\\styra.exe")
      : targetOS === "darwin"
      ? moveFile(tempFileLocation, "/usr/local/bin/styra")
      : moveFile(tempFileLocation, "/usr/local/bin/styra");
    vscode.window.showInformationMessage("Styra CLI installed.");
    configureStyra();
  });
  writeStream.on("error", (error) => {
    console.log("error writing to file");
    console.log(error);
  });
}

function configureStyra() {
  fs.exists(os.homedir + "/.styra/config", (exists) => {
    if (!exists) {
      console.log("Configuring the Styra CLI");
      const dasURL = vscode.workspace
        .getConfiguration("styra")
        .get<string>("url");
      const token = vscode.workspace
        .getConfiguration("styra")
        .get<string>("token");
      if (!dasURL) {
        vscode.window.showErrorMessage("Please set the Styra DAS URL");
        return;
      }
      if (!token) {
        vscode.window.showErrorMessage("Please set the Strya DAS API token");
        return;
      }
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
  });
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
