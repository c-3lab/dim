import { ensureDirSync, ky } from "../deps.ts";
import { DEFAULT_DATAFILES_PATH } from "./consts.ts";

export class Downloader {
  async download(
    url: URL,
    name: string,
    headers?: Record<string, string>,
  ): Promise<string> {
    const splitedURLPath = url.pathname.split("/");
<<<<<<< HEAD
    const dir = `${DEFAULT_DATAFILES_PATH}/${name}`;
    const file = splitedURLPath[splitedURLPath.length - 1];
=======
    const joinedDirPath = splitedURLPath
      .slice(0, splitedURLPath.length - 1)
      .join("/");
    const dir = `${DEFAULT_DATAFILES_PATH}/${url.hostname}${joinedDirPath}`;
    const fileName = splitedURLPath[splitedURLPath.length - 1];
>>>>>>> Change download to ky
    ensureDirSync(dir);
    const response = await ky.get(url, { headers: headers });
    const path = dir + "/" + fileName;
    Deno.writeFileSync(path, new Uint8Array(await response.arrayBuffer()));
    return path;
  }
}
