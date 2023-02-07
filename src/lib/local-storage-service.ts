import {Memento} from 'vscode';

export enum Workspace {
  // add values as the need arises
  CmdName = 'CmdName',
  UpdateCheckDate = 'UpdateCheckDate'
}

// Adapted from https://www.chrishasz.com/blog/2020/07/28/vscode-how-to-use-local-storage-api/
export class LocalStorageService {

  private constructor() { /* */ }

  private static Instance: LocalStorageService;
  private state: Memento | undefined;

  public static get instance(): LocalStorageService {

    return this.Instance || (this.Instance = new this());
  }

  // NB: This must be called during program startup!
  public set storage(state: Memento) {
    this.state = state;
  }

  public getValue<T>(key: string): T|null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.state ? this.state.get<T>(key, null as any) : null;
  }

  public setValue<T>(key: string, value: T): void {
    this.state?.update(key, value);
  }

}
