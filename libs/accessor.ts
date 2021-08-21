import { existsSync } from "../deps.ts";
import { Content, DimJSON, DimLockJSON, LockContent } from "./types.ts";
import {
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DIM_LOCK_VERSION,
} from "./consts.ts";

export class DimFileAccessor {
  private dimJSON: DimJSON | undefined;
  constructor() {
    if (existsSync(DEFAULT_DIM_FILE_PATH)) {
      this.dimJSON = JSON.parse(Deno.readTextFileSync(DEFAULT_DIM_FILE_PATH));
    } else {
      console.log("Not found a dim.json. You should run a 'dim init'. ");
      Deno.exit(0);
    }
  }
  private async writeToDimFile(json: DimJSON) {
    await Deno.writeTextFile(
      DEFAULT_DIM_FILE_PATH,
      JSON.stringify(json, null, 2),
    );
  }
  async addContent(url: string, name: string, preprocesses: string[]) {
    if (this.dimJSON === undefined) {
      return;
    }
    const content: Content = { url, name, preprocesses };
    // Override the existing content.
    const currentContents = this.dimJSON.contents.filter((c) =>
      c.url !== content.url
    );
    const contents = new Array<Content>(...currentContents, content);
    await this.writeToDimFile({ contents: contents });
  }
  getContents(): Content[] {
    if (this.dimJSON !== undefined) {
      return this.dimJSON.contents;
    } else {
      return [];
    }
  }
}

export class DimLockFileAccessor {
  private dimLockJSON: DimLockJSON | undefined;
  constructor() {
    if (existsSync(DEFAULT_DIM_LOCK_FILE_PATH)) {
      this.dimLockJSON = JSON.parse(
        Deno.readTextFileSync(DEFAULT_DIM_LOCK_FILE_PATH),
      );
    } else {
      console.log("Not found a dim-lock.json");
      Deno.exit(0);
    }
  }
  private async writeToDimLockFile(json: DimLockJSON) {
    await Deno.writeTextFile(
      DEFAULT_DIM_LOCK_FILE_PATH,
      JSON.stringify(json, null, 2),
    );
  }
  async addContent(
    url: string,
    path: string,
    name: string,
    preprocesses: string[],
  ) {
    if (this.dimLockJSON === undefined) {
      return;
    }
    const lastUpdated: Date = new Date();
    const content: LockContent = { url, path, name, preprocesses, lastUpdated };
    // Override the existing content.
    const currentContents = this.dimLockJSON.contents.filter((c) =>
      c.url !== content.url
    );
    const contents = new Array<LockContent>(...currentContents, content);
    await this.writeToDimLockFile({
      lockFileVersion: DIM_LOCK_VERSION,
      contents: contents,
    });
  }
  getContents(): LockContent[] {
    if (this.dimLockJSON !== undefined) {
      return this.dimLockJSON.contents;
    } else {
      return [];
    }
  }
}
