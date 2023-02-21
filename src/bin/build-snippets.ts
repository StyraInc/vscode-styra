import {runStyraCmd} from '../lib-sans-vscode/command-runner';

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
//     redirecting output to overwrite the kubernetes.json file in this project. Example:
//       ts-node ../vscode-styra/src/bin/build-snippets.ts > ../vscode-styra/snippets/kubernetes.json
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
  scope: string;
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
  for (const {id: prefix, title, description} of inputSnippets) {
    const result = {prefix, description, scope: 'rego', body: [await getTemplate(prefix)]};
    snippets[title] = result;
    // eslint-disable-next-line no-console
    console.error(prefix); // report progress since it takes a couple seconds per snippet
  }

  // Add a "help" snippet for good measure!
  // TODO: put this in EVERY system type.
  snippets['Styra Link intro'] = {
    prefix: 'help_rego',
    description: 'Introductory remarks on rego, Styra Link, and VSCode',
    scope: 'rego',
    body: [
      '# Welcome to the world of rego!',
      '# The VSCode plugin provides a wealth of ready-made snippets to jump start your rego journey.',
      '# Note that whether you have any snippets depends on the system type of the DAS system',
      '# that you have connected to your currently loaded VSCode project with Styra Link.',
      '# Use the "Styra Link: Initialize" command to set that up if you you have not already.',
      '# Some useful links:',
      '#    Rego Language https://www.openpolicyagent.org/docs/latest/policy-reference/',
      '#    Styra DAS https://docs.styra.com/das',
    ]
  };
  return snippets;
}

main();
