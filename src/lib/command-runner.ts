import cp = require("child_process");

export class CommandRunner {
  // executes the command at path with args and stdin.  The callback is
  // invoked with an error message on failure or JSON object on success.
  run(
    path: string,
    args: string[],
    stdin: string,
    cb: (error: string, result: any) => void
  ): void {
    this.runWithStatus(
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
  runWithStatus(
    path: string,
    args: string[],
    stdin: string,
    cb: (code: number, stderr: string, stdout: string) => void
  ): void {
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
}
