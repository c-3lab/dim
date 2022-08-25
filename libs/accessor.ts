import { Content, DimJSON, DimLockJSON, LockContent } from "./types.ts";
import {
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DIM_FILE_VERSION,
  DIM_LOCK_FILE_VERSION,
} from "./consts.ts";
import { Colors } from "../deps.ts";

export class DimFileAccessor {
  private dimJSON: DimJSON | undefined;
  constructor(path = DEFAULT_DIM_FILE_PATH) {
    try {
      Deno.statSync(path);
      this.dimJSON = JSON.parse(Deno.readTextFileSync(path));
    } catch {
      console.log(
        Colors.red("Not found a dim.json. You should run a 'dim init'. "),
      );
      Deno.exit(1);
    }
  }
  private async writeToDimFile(json: DimJSON) {
    await Deno.writeTextFile(
      DEFAULT_DIM_FILE_PATH,
      JSON.stringify(json, null, 2),
    );
  }
  async addContent(
    url: string,
    name: string,
    postProcesses: string[],
    headers: Record<string, string>,
    catalogUrl: string | null = null,
    catalogResourceId: string | null = null,
  ) {
    if (this.dimJSON === undefined) {
      return;
    }
    const content: Content = {
      url,
      name,
      catalogUrl,
      catalogResourceId,
      postProcesses,
      headers,
    };
    const contents = this.dimJSON.contents;
    const contentIndex = this.dimJSON.contents.findIndex((c) => c.name === name);
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
    if (this.dimJSON === undefined) {
      return;
    }
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
    if (this.dimJSON === undefined) {
      return;
    }
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
  private dimLockJSON: DimLockJSON | undefined;
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
    if (this.dimLockJSON === undefined) {
      return;
    }
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
    if (this.dimLockJSON === undefined) {
      return;
    }
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
