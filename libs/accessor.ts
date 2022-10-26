import { Content, DimJSON, DimLockJSON, LockContent } from "./types.ts";
import {
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DIM_FILE_VERSION,
  DIM_LOCK_FILE_VERSION,
} from "./consts.ts";
import { Colors } from "../deps.ts";

export class DimFileAccessor {
  private dimJSON: DimJSON;
  constructor(path = DEFAULT_DIM_FILE_PATH) {
    try {
      Deno.statSync(path);
      this.dimJSON = JSON.parse(Deno.readTextFileSync(path));
    } catch {
      if (path === DEFAULT_DIM_FILE_PATH) {
        console.log(
          Colors.red("Not found a dim.json. You should run a 'dim init'. "),
        );
      } else {
        console.log(
          Colors.red("Selecting other than json."),
        );
      }
      Deno.exit(1);
    }
  }
  private async writeToDimFile(json: DimJSON) {
    await Deno.writeTextFile(
      DEFAULT_DIM_FILE_PATH,
      JSON.stringify(json, null, 2),
    );
  }
  async addContent(content: Content) {
    const contents = this.dimJSON.contents;
    const contentIndex = this.dimJSON.contents.findIndex((c) => c.name === content.name);
    if (contentIndex !== -1) {
      // Override the existing content.
      contents.splice(contentIndex, 1, content);
    } else {
      contents.push(content);
    }
    await this.writeToDimFile({
      fileVersion: DIM_FILE_VERSION,
      contents: contents,
    });
  }
  async addContents(contents: Content[]) {
    // Override the existing content.
    const currentContents = this.dimJSON.contents.filter((c) =>
      !contents.map((newContent) => newContent.name).includes(
        c.name,
      )
    );
    const resultContents = new Array<Content>(
      ...currentContents,
      ...contents,
    );
    await this.writeToDimFile({
      fileVersion: DIM_FILE_VERSION,
      contents: resultContents,
    });
  }
  async removeContent(name: string) {
    const contents = this.dimJSON.contents.filter((c) => c.name !== name);
    await this.writeToDimFile({
      fileVersion: DIM_FILE_VERSION,
      contents: contents,
    });
    return this.dimJSON.contents.length != contents.length;
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
  private dimLockJSON: DimLockJSON;
  constructor() {
    try {
      Deno.statSync(DEFAULT_DIM_LOCK_FILE_PATH);
      this.dimLockJSON = JSON.parse(
        Deno.readTextFileSync(DEFAULT_DIM_LOCK_FILE_PATH),
      );
    } catch {
      console.log("Not found a dim-lock.json");
      Deno.exit(1);
    }
  }
  private async writeToDimLockFile(json: DimLockJSON) {
    await Deno.writeTextFile(
      DEFAULT_DIM_LOCK_FILE_PATH,
      JSON.stringify(json, null, 2),
    );
  }
  async addContent(content: LockContent) {
    const contents = this.dimLockJSON.contents;
    const contentIndex = this.dimLockJSON.contents.findIndex((c) => c.name === content.name);
    if (contentIndex !== -1) {
      // Override the existing content.
      contents.splice(contentIndex, 1, content);
    } else {
      contents.push(content);
    }
    await this.writeToDimLockFile({
      lockFileVersion: DIM_LOCK_FILE_VERSION,
      contents: contents,
    });
  }
  async addContents(contents: LockContent[]) {
    // Override the existing content.
    const currentContents = this.dimLockJSON.contents.filter((c) =>
      !contents.map((newContent) => newContent.name).includes(
        c.name,
      )
    );
    const resultContents = new Array<LockContent>(
      ...currentContents,
      ...contents,
    );
    await this.writeToDimLockFile({
      lockFileVersion: DIM_LOCK_FILE_VERSION,
      contents: resultContents,
    });
  }
  async removeContent(name: string) {
    if (this.dimLockJSON === undefined) {
      return;
    }
    const contents = this.dimLockJSON.contents.filter((c) => c.name !== name);
    await this.writeToDimLockFile({
      lockFileVersion: DIM_LOCK_FILE_VERSION,
      contents: contents,
    });
    return this.dimLockJSON.contents.length != contents.length;
  }
  getContents(): LockContent[] {
    if (this.dimLockJSON !== undefined) {
      return this.dimLockJSON.contents;
    } else {
      return [];
    }
  }
}
