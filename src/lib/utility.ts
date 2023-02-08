import {GenericJson} from './types';
import {outputChannel} from './outputPane';
import {StyraConfig} from './styra-config';
import {StyraInstall} from './styra-install';

// Useful for taking results from an API call—whether snake case, pascal case,
// or kebab-case—and mapping them to our canonical camel case for property names.
// Note this transform only the top-level keys of the object.
//
// - In the rare event of collisions, the developer needs to be on the lookout for
// keys annotated with the `_COLLISION` suffix.
// - In the even more rare event of multiple collisions on the same key,
// the collisions are all coalesced to a single such `_COLLISION` suffix.
export function normalizeJsonProperties(json: GenericJson): GenericJson {
  return Object.keys(json).reduce((result: GenericJson, key: string) => {
    let newKey = camelCase(key);
    // trim leading and trailing UNLESS the key is all whitespace, then leave it alone
    newKey = newKey.trim() ? newKey.trim() : newKey;
    if (result[newKey]) {
      newKey += '_COLLISION';
    }
    result[newKey] = json[key];
    return result;
  }, {});
}

function camelCase(str: string) {
  return str
    // handle snake, kebab, and whitespace
    .replace(/([_-]|\s+)([A-Za-z])/g, (match) => match.slice(-1).toUpperCase())
    // handle Pascal case
    .replace(/[a-zA-Z]/, (match) => match.toLowerCase());
}

// TODO: be quiet about the output on subsequent runs...?
export async function checkStartup(): Promise<boolean> {

  outputChannel.show(true);

  if (!StyraInstall.checkWorkspace()) {
    return false;
  }
  if (!(await StyraInstall.checkCliInstallation())) {
    return false;
  }
  if (!(await StyraConfig.checkCliConfiguration())) {
    return false;
  }
  await StyraInstall.checkForUpdates();
  return true;
}
