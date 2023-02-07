/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable camelcase */

// partial definition
export type System = {
  id: string;
  name: string;
};

export interface ICommand {
  run: () => Promise<void>;
}

export type VersionType = {
  version: string;
  opa_version: string;
  release: string;
  on_prem_release: string;
  slp_version: string;
  cli_version: string;
  datasources_agent_version: string;
}

