import * as fs from "fs";
import * as os from "os";

export type ConfigData = {
  url: string;
  token: string;
};

export const CONFIG_FILE_PATH = `${os.homedir}/.styra/config`;

export class StyraConfig {
  static async read(): Promise<ConfigData> {
    const configData = <ConfigData>{};
    return await fs.promises.readFile(CONFIG_FILE_PATH, "utf8").then((data) => {
      data.split(/\r?\n/).forEach((line) => {
        const {key, value} = line.match(/(?<key>\w+):\s*(?<value>.+)/)?.groups ?? {};
          if (key === "url") {
            configData.url = value;
          }
          if (key === "token") {
            configData.token = value;
          }
          // silently ignore any other properties in the config, valid or not
      });
      return configData;
    });
  }
}
