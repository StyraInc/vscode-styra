import * as https from 'https';
import {default as fetch} from 'node-fetch';
import {FilesAndData} from './FilesAndData';
import {posix} from 'path';
import {URL} from 'url';

export type PreviewHeaders = {[key:string]:string};
export type PreviewOption = 'instrument' | 'print' | 'provenance' | 'sandbox' | 'strict' | 'strict-builtin-errors';
export interface AuthProvider {
    headers?: (headers: PreviewHeaders) => PreviewHeaders;
    agentOptions?: (options: https.AgentOptions) => https.AgentOptions;
}
export type PreviewArgs = {
    query?: string
    input?: object,
    filesAndData?: FilesAndData,
    additionalHeaders?: PreviewHeaders,
    options?: PreviewOption[],
    agentOptions?: https.AgentOptions,
};

export class PreviewBuilder {
  _apiRoot: URL;
  _path: string;
  _query: string;
  _input?: object;
  _filesAndData?: FilesAndData;
  _options?: PreviewOption[];
  _agentOptions?: https.AgentOptions;
  _additionalHeaders?: PreviewHeaders;
  _authProvider?: AuthProvider;

  constructor(apiRoot: string) {
    this._apiRoot = new URL(apiRoot);
    this._path = '';
    this._query = '';
  }

  query(query: string): PreviewBuilder {
    this._query = query;
    return this;
  }

  path(path: string): PreviewBuilder {
    this._path = path;
    return this;
  }

  input(input?: object): PreviewBuilder {
    this._input = input;
    return this;
  }

  filesAndData(filesAndData?: FilesAndData): PreviewBuilder {
    this._filesAndData = filesAndData;
    return this;
  }

  options(options?: PreviewOption[]): PreviewBuilder {
    this._options = options;
    return this;
  }

  agentOptions(options?: https.AgentOptions): PreviewBuilder {
    this._agentOptions = options;
    return this;
  }

  additionalHeaders(headers?: PreviewHeaders): PreviewBuilder {
    this._additionalHeaders = headers;
    return this;
  }

  authProvider(provider?: AuthProvider): PreviewBuilder {
    this._authProvider = provider;
    return this;
  }

  build(): PreviewRequest {
    // Process auth if provided
    if (this._authProvider) {
      if (this._authProvider.headers) {
        if (this._additionalHeaders === undefined) {
          this._additionalHeaders = {};
        }
        this._additionalHeaders = this._authProvider.headers(this._additionalHeaders);
      }
      if (this._authProvider.agentOptions) {
        if (this._agentOptions === undefined) {
          this._agentOptions = {};
        }
        this._agentOptions = this._authProvider.agentOptions(this._agentOptions);
      }
    }
    // Build the PreviewRequest
    const args: PreviewArgs = {
      query: this._query,
      input: this._input,
      filesAndData: this._filesAndData,
      additionalHeaders: this._additionalHeaders,
      options: this._options,
      agentOptions: this._agentOptions,
    };
    return new PreviewRequest(this._apiRoot, this._path, args);
  }
}

export class PreviewRequest {
  readonly apiRoot: URL;
  readonly path: string;
  readonly args: PreviewArgs;

  constructor(apiRoot: URL, path?: string, args?: PreviewArgs) {
    this.apiRoot = apiRoot;
    this.path = path || '';
    this.args = args || {};
  }

  async run(): Promise<object> {
    const reqUrl = new URL(this.apiRoot.toString());
    reqUrl.pathname = posix.join(reqUrl.pathname, 'v0', 'preview', this.path);
    if (this.args.options !== undefined) {
      const searchParams = reqUrl.searchParams;
      for (const option of this.args.options) {
        searchParams.append(option, 'true');
      }
      reqUrl.search = searchParams.toString();
    }

    const headers: PreviewHeaders = {};
    const body: {[key: string]:any} = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (this.args.query !== undefined && this.args.query !== '') {
      body.rego = this.args.query;
    }
    if (this.args.additionalHeaders !== undefined) {
      Object.assign(headers, this.args.additionalHeaders);
    }
    if (this.args.input !== undefined) {
      body.input = this.args.input;
      Object.assign(headers, {'Content-Type': 'application/json'});
    }
    if (this.args.filesAndData !== undefined) {
      if (this.args.filesAndData.hasData()) {
        body.data = this.args.filesAndData.data;
      }
      if (this.args.filesAndData.hasFiles()) {
        body.rego_modules = this.args.filesAndData.files;
      }
    }

    let sslConfiguredAgent: https.Agent | undefined;
    if (this.args.agentOptions) {
      sslConfiguredAgent = new https.Agent(this.args.agentOptions);
    }

    const req = await fetch(reqUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      agent: sslConfiguredAgent,
    });
    return await req.json();
  }
}
