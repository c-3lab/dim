import { download, DownlodedFile, ensureDirSync } from "../deps.ts";
import { DEFAULT_DATAFILES_PATH } from "./consts.ts";

export class Downloader {
  async download(url: URL): Promise<DownlodedFile> {
    const splitedURLPath = url.pathname.split("/");
    const joinedDirPath = splitedURLPath
      .slice(0, splitedURLPath.length - 1)
      .join("/");
    const dir = `${DEFAULT_DATAFILES_PATH}/${url.hostname}${joinedDirPath}`;
    const file = splitedURLPath[splitedURLPath.length - 1];
    ensureDirSync(dir);
    return await download(url, {
      file,
      dir,
    });
  }
}
