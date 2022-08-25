import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { InitAction, InstallAction, UpdateAction } from "../../libs/actions.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";
Deno.test("UninstallAction", async (t) => {
  Deno.chdir(temporaryDirectory);
  await new InitAction().execute();
  await new InstallAction().execute(
    { name: "example" },
    "https://www.city.fukuoka.lg.jp/data/open/cnt/3/59282/1/27_04_01_1.xlsx",
  );

  //  install済みの名前を指定し実行
  await t.step(
    'execute with the "name" listed in dim.json to check if the data has been updated.',
    async () => {
      await new UpdateAction().execute({}, "example");
    },
  );

  //  未installの名前を指定し実行
  await t.step(
    'exit with error when run with "name" not listed in dim.json',
    async () => {
      let error = "";
      await new UpdateAction().execute({}, "example2").catch((e) => {
        error = e.message;
      });
      assertEquals(error, "Test case attempted to exit with exit code: 1");
    },
  );

  //  全データ更新
  "execute without specifying any options or arguments, and check if the data in dim.json has been updated.";
  //  非同期化
  "specify -A and check for asynchronous execution";
  removeTemporaryFiles();
});
