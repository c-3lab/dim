import { ensureDirSync, ensureFileSync } from "../deps.ts";
import {
  DEFAULT_DATAFILES_PATH,
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
} from "./consts.ts";

interface Action {
}

export class InitAction implements Action {
  static createDataFiles() {
    ensureDirSync(DEFAULT_DATAFILES_PATH);
  }
  static createDimJson() {
    ensureFileSync(DEFAULT_DIM_FILE_PATH);
    ensureFileSync(DEFAULT_DIM_LOCK_FILE_PATH);
  }
  execute(options: any): void {
    console.log(options);
    InitAction.createDataFiles();
    InitAction.createDimJson();
  }
}

export class InstallAction implements Action {
  execute(options: any, url: string): void {
    console.log(options, url);
  }
}

export class UninstallAction implements Action {
  execute(options: any, name: string): void {
    console.log(options, name);
  }
}

export class UpdateAction implements Action {
  execute(options: any, name: string): void {
    console.log(options, name);
  }
}
