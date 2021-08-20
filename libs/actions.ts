import { Colors, ensureDir, ensureFile } from "../deps.ts";
import {
  DEFAULT_DATAFILES_PATH,
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DIM_LOCK_VERSION,
} from "./consts.ts";
import { Downloader } from "./downloader.ts";
import { DimJSON, DimLockJSON } from "./types.ts";

interface Action {
}

export class InitAction implements Action {
  static async createDataFiles() {
    ensureDir(DEFAULT_DATAFILES_PATH);
  }
  static async createDimJson() {
    const dimFilePromise = new Promise(async () => {
      const dimData: DimJSON = { data: [] };
      await ensureFile(DEFAULT_DIM_FILE_PATH);
      Deno.writeTextFile(DEFAULT_DIM_FILE_PATH, JSON.stringify(dimData));
    });
    const dimLockFilePromise = new Promise(async () => {
      const dimLockData: DimLockJSON = {
        lockFileVersion: DIM_LOCK_VERSION,
        data: [],
      };
      await ensureFile(DEFAULT_DIM_LOCK_FILE_PATH);
      Deno.writeTextFile(
        DEFAULT_DIM_LOCK_FILE_PATH,
        JSON.stringify(dimLockData),
      );
    });
    Promise.all([dimFilePromise, dimLockFilePromise]);
  }
  async execute(options: any) {
    await Promise.all([
      InitAction.createDataFiles(),
      InitAction.createDimJson(),
    ]);
    console.log(Colors.green("Initialized the project for the dim."));
  }
}

export class InstallAction implements Action {
  async execute(options: any, url: string) {
    await new Downloader().download(new URL(url));
    console.log(Colors.green(`Installed ${url}`));
  }
}

export class UninstallAction implements Action {
  execute(options: any, name: string): void {
    console.log(options, name);
  }
}

export class ListAction implements Action {
  execute(options: any): void {
    console.log(options);
  }
}

export class UpdateAction implements Action {
  execute(options: any, name: string): void {
    console.log(options, name);
  }
}
