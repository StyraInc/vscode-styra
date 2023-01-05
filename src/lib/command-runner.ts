import * as vscode from "vscode";
import { spawn } from "child_process";
import { log } from "./output";

export class CommandRunner {

  // executes the command at path with args and stdin.
  // Upon success returns the command's output.
  // Upon failure returns the stderr output in an exception.
  async run(
    path: string,
    args: string[],
    stdin = ""
  ): Promise<string> {
    log(`spawn: ${path}, args: [${args.toString()}]`);

    // adapted from https://stackoverflow.com/a/58571306
    const proc = spawn(path, args);
    proc.stdin.write(stdin);
    proc.stdin.end();

    let data = "";
    for await (const chunk of proc.stdout) {
      console.log("stdout chunk: " + chunk);
      data += chunk;
    }
    let error = "";
    for await (const chunk of proc.stderr) {
      error += chunk;
    }
    const exitCode = await new Promise((resolve, _reject) => {
      log(`spawn(${path}) completed successfully`);
      proc.on("close", resolve);
    });
    if (exitCode) {
      vscode.window.showErrorMessage(error);
      throw new Error(error);
    }
    return data;
  }
}
