import { infoNewCmd } from "../lib/outputPane";
import { StyraConfig } from "../lib/styra-config";
import { StyraInstall } from "../lib/styra-install";
import { ICommand } from "../lib/types";

export class LinkInit implements ICommand {

  async run(): Promise<void> {
    infoNewCmd("Link Init");

    if (!await StyraInstall.checkCliInstallation()) {
      return;
    }

    if (!await StyraConfig.checkCliConfiguration()) {
      return;
    }


  }
}