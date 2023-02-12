// partial definition
export type System = {
  id: string;
  name: string;
};

export type GenericJson = Record<string, unknown>;

export interface ICommand {
  run: () => Promise<void>;
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
}
