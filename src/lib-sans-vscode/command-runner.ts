import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

export async function runStyraCmd(cmd: string): Promise<string> {
  const child = spawn('styra', cmd.split(/ +/));
  return getResults(child);
}

async function getResults(child: ChildProcessWithoutNullStreams): Promise<string> {

  let data = '';
  for await (const chunk of child.stdout) {
    data += chunk;
  }
  let error = '';
  for await (const chunk of child.stderr) {
    error += chunk;
  }
  const exitCode = await new Promise((resolve, _reject) => {
    child.on('close', resolve);
  });

  if (exitCode) {
    throw new Error(error);
  }
  return data;
}
