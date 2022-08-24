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
  await t.step("Specify an installed name and run", async () => {
    await new UpdateAction().execute({}, "example");
  });

  //  未installの名前を指定し実行
  await t.step("Specify an uninstalled name and run", async () => {
    let error = "";
    await new UpdateAction().execute({}, "example2").catch((e) => {
      error = e.message;
    });
    assertEquals(error, "Test case attempted to exit with exit code: 1");
  });

  //  install済みの名前と-p "xlsx-to-csv"を指定し実行
  await t.step(
    'Specify the installed name and -p "xlsx-to-csv" and execute',
    async () => {
      await new UpdateAction().execute(
        { postProcesses: ["xlsx-to-csv"] },
        "example",
      );
    },
  );
  removeTemporaryFiles();
});
