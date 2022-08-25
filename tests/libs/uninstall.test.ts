import { InstallAction, UninstallAction } from "../../libs/actions.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

//  Uninstall
Deno.test("UninstallAction", async (t) => {
  Deno.chdir(temporaryDirectory);
  Deno.writeTextFileSync(
    "dim.json",
    JSON.stringify({ fileVersion: "1.1", contents: [] }),
  );
  await new InstallAction().execute(
    { name: "example" },
    "	https://www.pref.ehime.jp/opendata-catalog/dataset/2262/resource/9169/7iryouinnR3.pdf",
  );

  //  install済みの名前を指定して実行
  await t.step(
    "delete downloaded data and rewrite dim.json, dim-lock.json",
    async () => {
      let _: void;
      await new UninstallAction().execute(_, "example");
    },
  );

  //  未installの名前を指定して実行
  await t.step(
    'exit with error when run with "name" not recorded in dim.json',
    async () => {
      let _: void;
      await new UninstallAction().execute(_, "example");
    },
  );
  removeTemporaryFiles();
});
