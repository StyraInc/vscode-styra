export class EnvironmentError extends Error {}

export class ArgumentError extends Error {}

export class FileError extends Error {
  original: Error;
  path: string;

  constructor(e: Error, path: string) {
    super(e.message);
    this.original = e;
    this.path = path;
  }

  get message() {
    return `Error in ${this.path}: ${this.original.message}`;
  }

  get cause() {
    return this.original.cause;
  }

  get name() {
    return `Error in ${this.path}: ${this.original.name}`;
  }

  get stack() {
    return this.original.stack;
  }
}
