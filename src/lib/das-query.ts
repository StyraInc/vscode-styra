import {default as fetch, Request} from 'node-fetch';

import {GenericJson} from './types';
import {normalizeObjKeys} from './normalize-obj-keys';
import {StyraConfig} from '../lib/styra-config';

export class DAS {

  // path example: /v1/systems?compact=true
  static async runQuery(path: string, normalize = true): Promise<GenericJson> {

    const config = await StyraConfig.getDASConfig();
    const request = new Request(`${config.url}${path}`, {
      method: 'GET',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${config.token}`,
      },
    });
    const response = await (await fetch(request)).json();
    return normalize ? normalizeObjKeys(response) : response;
  }
}
