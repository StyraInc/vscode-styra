import * as https from 'https';
import {PreviewHeaders} from './Preview';

export class TLSAuth {
  readonly cert: string;
  readonly key: string;

  constructor(cert: string, key: string) {
    this.cert = cert;
    this.key = key;
  }

  agentOptions(options: https.AgentOptions): https.AgentOptions {
    options.cert = this.cert;
    options.key = this.key;
    options.keepAlive = false;

    return options;
  }
}

export class TokenAuth {
  readonly token: string;

  constructor(token: string) {
    this.token = token;
  }

  headers(headers: PreviewHeaders): PreviewHeaders {
    headers.Authorization = `Bearer ${this.token}`;

    return headers;
  }
}
