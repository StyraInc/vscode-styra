import * as yaml from 'js-yaml';
import {readFileSync, writeFileSync} from 'fs';

// This is an offline snippet generation tool.
//
// Usage:
// (1) Install ts-node (npm install -g ts-node)
// (2) npm run snippets:build:common

type ArbitraryJson = Record<string, unknown>;

// For any value in a JSON object that is a string with embedded newlines,
// convert it to a string array so the resulting JSON file is MUCH more readable.
function transformJSON(json: ArbitraryJson): unknown {
  if (typeof json === 'string') {
    return (json as string).includes('\n') ? (json as string).split('\n') : json;
  }
  if (json instanceof Array) {
    return json.map(transformJSON);
  }
  if (typeof json === 'object') {
    const newObj: ArbitraryJson = {};
    for (const key of Object.keys(json)) {
      newObj[key] = transformJSON(json[key] as ArbitraryJson);
    }
    return newObj;
  }
  return json;
}

function yamlToJson(filePath: string) {
  try {
    const json = yaml.load(readFileSync(`${filePath}.yaml`, 'utf8'));
    const betterJson = transformJSON(json as ArbitraryJson);
    writeFileSync(`${filePath}.json`, JSON.stringify(betterJson, null, 2));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
}

function main() {
  yamlToJson('snippets/styra-common');
}

main();
