import jmespath = require('jmespath');
// import fs = require('fs');
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

// Why jmespath? In the node world, it is much more prevalent than jsonPath:
// https://npmtrends.com/JSONPath-vs-jmespath
// https://jmespath.org/tutorial.html

// Tips on running from the command line:
// https://stackoverflow.com/questions/33535879/how-to-run-typescript-files-from-command-line

// function hello() {
//   fs.readFile('./all_snippets.json', 'utf8', function (err, data) {
//     if (err) {throw err;} // we'll not consider error handling for now
//     return JSON.parse(data);
//   });
//   return jmespath.search({ foo: { bar: { baz: [0, 1, 2, 3, 4] } } }, 'foo.bar.baz[2]');
// }

async function spawnChild(child: ChildProcessWithoutNullStreams) {

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

  if (exitCode && !exitCode) { // TODO
    throw new Error(`subprocess error exit ${exitCode}, ${error}`);
  }
  return data;
}

async function main() {
  const child = spawn('styra', [ 'link', 'rules', 'search', '-o', 'json' ]);
  try {
    const data = await spawnChild(child);
    const myJson = JSON.parse(data);
    const keys = jmespath.search(myJson, 'keys(@)');
    // eslint-disable-next-line no-console
    console.log(keys);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('async error:\n' + err);
  }
}

main();
