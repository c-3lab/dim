import { resolve } from "https://deno.land/std/path/mod.ts";

const currentDirectory = new URL(".", import.meta.url).pathname;
export const temporaryDirectory = resolve(currentDirectory, "temporary") + "/";

//  テスト中の生成物を削除
export const removeTemporaryFiles = () => {
  for (const path of Deno.readDirSync(temporaryDirectory)) {
    Deno.removeSync(temporaryDirectory + path.name, { recursive: true });
  }
};
