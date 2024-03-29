// partial definition
export type System = {
  id: string;
  name: string;
};

export type GenericJson = Record<string, unknown>;

export enum ReturnValue {
  Completed = 'Completed',
  TerminatedByUser = 'TerminatedByUser'
  // Failed is implicit by an error being thrown
}

export interface ICommand {
  run: () => Promise<ReturnValue>;
  title: string;
}

export type VersionType = {
  version: string;
  opaVersion: string;
  release: string;
  onPremRelease: string;
  slpVersion: string;
  cliVersion: string;
  datasourcesAgentVersion: string;
  dasEdition: string;
}

