import {default as fetch, Request} from 'node-fetch';

import {DAS_CONFIG_FILE_PATH, DASConfigData, StyraConfig} from '../lib/styra-config';
import {GenericJson} from './types';
import {normalizeObjKeys} from './normalize-obj-keys';

export class DAS {

  // path example: /v1/systems?compact=true
  static async runQuery(path: string, normalize = true): Promise<GenericJson> {

    const configData: DASConfigData = await StyraConfig.read(DAS_CONFIG_FILE_PATH, new DASConfigData());
    const request = new Request(`${configData.url}${path}`, {
      method: 'GET',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${configData.token}`,
      },
    });
    const response = await (await fetch(request)).json();
    return normalize ? normalizeObjKeys(response) : response;
  }
}
