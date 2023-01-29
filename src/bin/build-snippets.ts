// import jmespath = require('jmespath');
import { runStyraCmd } from '../lib-sans-vscode/command-runner';

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

type InputSnippetType = {
  id: string;
  title: string;
  description: string;
}

type OutputSnippetType = {
  body: string[];
  prefix: string;
  description: string;
}

async function main() {
  try {
    const data = await runStyraCmd('link rules search -o json');
    const myJson = JSON.parse(data);
    const snippets = await generateSnippets(Object.values(myJson) as InputSnippetType[]);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(snippets, null, 4));
    // TODO: write to file here
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('async error:\n' + err);
  }
}

async function getTemplate(id: string): Promise<string> {
  return await runStyraCmd(`link rules use ${id}`);
}

async function generateSnippets(inputSnippets: InputSnippetType[]): Promise<{ [key: string]: OutputSnippetType }> {
  const snippets: { [key: string]: OutputSnippetType } = {};
  
  // Neither reduce nor forEach will iterate the async operations serially; need the humble for loop to do it.
  // Running them in parallel overwhelms the system and causes an eventual timeout
  for (const { id: prefix, title, description } of inputSnippets) {
    const result = { prefix, description, body: [await getTemplate(prefix)] };
    snippets[title] = result;
    // eslint-disable-next-line no-console
    console.error(prefix); // report progress since it takes a couple seconds per snippet
  }
  return snippets;
}

main();
