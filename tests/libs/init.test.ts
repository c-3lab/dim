import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { InitAction } from "../../libs/actions.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

Deno.test("InitAction", async (t) => {
  Deno.chdir(temporaryDirectory);
  await t.step(
    "create empty data directory, dim.json and dim-lock.json",
    async () => {
      //  InitActionを実行
      await new InitAction().execute();

      //  data_files, dim.json, dim-lock.jsonを確認
      const dataDirectory = Deno.statSync("data_files");
      assertEquals(dataDirectory.isDirectory, true);

      const dimJson = JSON.parse(
        Deno.readTextFileSync("dim.json"),
      );
      assertEquals(dimJson, { fileVersion: "1.1", contents: [] });

      const dimLockJson = JSON.parse(
        Deno.readTextFileSync("dim-lock.json"),
      );
      assertEquals(dimLockJson, { lockFileVersion: "1.1", contents: [] });
    },
  );
  removeTemporaryFiles();
});
