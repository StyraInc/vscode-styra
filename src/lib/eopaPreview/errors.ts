export class EnvironmentError extends Error {}

export class ArgumentError extends Error {}

export class FileError extends Error {
  original: Error;
  path: string;

  constructor(e: Error, path: string) {
    super(`Error in ${path}: ${e.message}`);
    this.original = e;
    this.path = path;
  }

  get cause() {
    return this.original.cause;
  }

  get name() {
    return `Error in ${this.path}: ${this.original.name}`;
  }
}

export class APIError extends Error {
  body?: object;
  responseCode: number;

  constructor(responseCode: number, body?: object) {
    const errBody = body as {message?: string, code: string};
    if (body && errBody.message !== undefined && errBody.code !== undefined) {
      super(`${errBody.code} (${responseCode}): ${errBody.message}`);
    } else if (body && errBody.message !== undefined) {
      super(`${responseCode}: ${errBody.message}`);
    } else {
      super(`General API error (${responseCode})`);
    }
    this.responseCode = responseCode;
    this.body = body;
  }
}
