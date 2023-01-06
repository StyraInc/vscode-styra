import { ICommand } from "../lib/types";

export class LinkInit implements ICommand {
  async run(): Promise<void> {
    console.log("this is a call to styra link init");
  }
}