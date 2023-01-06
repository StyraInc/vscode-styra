import { infoNewCmd } from "../lib/outputPane";
import { ICommand } from "../lib/types";

export class LinkInit implements ICommand {
  async run(): Promise<void> {
    infoNewCmd("Link Init");
  }
}