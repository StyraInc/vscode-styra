import { runStyraCmd } from '../lib-sans-vscode/command-runner';

// This is an offline snippet generation tool.
//
// Usage:
//
// (1) Install ts-node:
//       npm install -g ts-node
// (2) Configure a styra link project with a kubernetes system:
//       cmd line: styra link init...
//       VSCode: "Styra Link: Initialize"
// (3) From that styra link project's root directory run this,
//     redirecting output to overwrite the snippets.json file in this project. Example:
//       ts-node ../vscode-styra/src/bin/build-snippets.ts > ../vscode-styra/snippets.json
//     Note that this will take 6 minutes to run, which is fine for now since it is done offline.

// Tips on running from the command line:
// https://stackoverflow.com/questions/33535879/how-to-run-typescript-files-from-command-line

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
