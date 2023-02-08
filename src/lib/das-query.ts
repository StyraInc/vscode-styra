import {default as fetch, Request} from 'node-fetch';

import {GenericJson} from './types';
import {info} from '../lib/outputPane';
import {StyraConfig} from '../lib/styra-config';

export class DAS {

  // path example: /v1/systems?compact=true
  static async runQuery(path: string): Promise<GenericJson> {

    const configData = await StyraConfig.read();
    const request = new Request(`${configData.url}${path}`, {
      method: 'GET',
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'application/json',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Authorization: `Bearer ${configData.token}`,
      },
    });
    info('Fetching ...'); // TODO
    const response = await fetch(request);
    return response.json();
  }
}
