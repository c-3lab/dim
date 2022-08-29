import { Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { resolve } from "https://deno.land/std@0.152.0/path/mod.ts";
import { ky } from "../deps.ts";

const currentDirectory = new URL(".", import.meta.url).pathname;
export const temporaryDirectory = resolve(currentDirectory, "temporary") + "/";
Deno.mkdirSync(temporaryDirectory, { recursive: true });

export const createKyGetStub = (body: string, options?: ResponseInit): Stub => {
  const mockedKy = ky.extend({
    hooks: {
      beforeRequest: [
        (_request) => {
          return new Response(body, options);
        },
      ],
    },
  });

  return stub(ky, "get", mockedKy.get);
};

//  テスト中の生成物を削除
export const removeTemporaryFiles = () => {
  //  Skip removing process when temporary directory does not exist
  try {
    Deno.statSync(temporaryDirectory);
  } catch {
    return;
  }

  for (const path of Deno.readDirSync(temporaryDirectory)) {
    Deno.removeSync(temporaryDirectory + path.name, { recursive: true });
  }
};
