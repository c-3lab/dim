import { Colors, ensureDir, ensureFile, existsSync } from "../deps.ts";
import {
  DEFAULT_DATAFILES_PATH,
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DIM_LOCK_VERSION,
} from "./consts.ts";
import { Downloader } from "./downloader.ts";
import { DimFileAccessor, DimLockFileAccessor } from "./accessor.ts";
import { Content, DimJSON, DimLockJSON } from "./types.ts";

const initDimFile = async () => {
  const dimData: DimJSON = { contents: [] };
  await ensureFile(DEFAULT_DIM_FILE_PATH);
  return Deno.writeTextFile(
    DEFAULT_DIM_FILE_PATH,
    JSON.stringify(dimData, null, 2),
  );
};

const initDimLockFile = async () => {
  const dimLockData: DimLockJSON = {
    lockFileVersion: DIM_LOCK_VERSION,
    contents: [],
  };
  await ensureFile(DEFAULT_DIM_LOCK_FILE_PATH);
  return Deno.writeTextFile(
    DEFAULT_DIM_LOCK_FILE_PATH,
    JSON.stringify(dimLockData, null, 2),
  );
};

interface Action {
}

export class InitAction implements Action {
  static async createDataFilesDir() {
    ensureDir(DEFAULT_DATAFILES_PATH);
  }
  static async createDimJson() {
    Promise.all([initDimFile, initDimLockFile]);
  }
  async execute(options: any) {
    await Promise.all([
      InitAction.createDataFilesDir(),
      InitAction.createDimJson(),
    ]);
    console.log(Colors.green("Initialized the project for the dim."));
  }
}

export class InstallAction implements Action {
  async execute(options: any, url: string | undefined) {
    await InitAction.createDataFilesDir();
    if (!existsSync(DEFAULT_DIM_LOCK_FILE_PATH)) {
      await initDimLockFile();
    }

    if (url !== undefined) {
      InstallAction.installFromURL(url);
    } else {
      InstallAction.installFromDimFile();
    }
  }
  private static async installFromURL(url: string) {
    const dimLockFileAccessor = new DimLockFileAccessor();
    const isInstalled = dimLockFileAccessor.getContents().some((
      lockContent,
    ) => lockContent.url === url);
    if (isInstalled) {
      console.log("The url have already been installed.");
      Deno.exit(0);
    }
    Promise.all([
      new Downloader().download(new URL(url)),
      new DimFileAccessor().addContent(url, url, []),
    ]).then((results) => {
      const fullPath = results[0].fullPath;
      new DimLockFileAccessor().addContent(url, fullPath, url, []);
      console.log(
        Colors.green(`Installed ${url}.`),
        `\nFile path:`,
        Colors.yellow(fullPath),
      );
    });
  }
  private static async installFromDimFile() {
    const contents = new DimFileAccessor().getContents();
    if (contents.length == 0) {
      console.log("No contents.\nYou should run a 'dim install <data url>'. ");
      return;
    }
    const dimLockFileAccessor = new DimLockFileAccessor();
    const isNotInstalled = (content: Content) =>
      dimLockFileAccessor.getContents().every((lockContent) =>
        lockContent.url !== content.url
      );
    const downloadList = contents.filter(isNotInstalled).map((content) => {
      return new Promise<string>(async (resolve) => {
        const result = await new Downloader().download(new URL(content.url));
        await dimLockFileAccessor.addContent(
          content.url,
          result.fullPath,
          content.url,
          [],
        );
        console.log(
          Colors.green(`Installed ${content.url}`),
          `\nFile path:`,
          Colors.yellow(result.fullPath),
        );
        console.log();
        resolve(result.fullPath);
      });
    });
    const results = await Promise.all(downloadList);
    if (results.length != 0) {
      console.log(
        Colors.green(`Successfully installed.`),
      );
    } else {
      console.log("All contents have already been installed.");
    }
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
