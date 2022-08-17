import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  spy,
} from "https://deno.land/std@0.152.0/testing/mock.ts";
import { InitAction, InstallAction } from "../../libs/actions.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

Deno.test("InitAction", async (t) => {
  Deno.chdir(temporaryDirectory);
  await t.step(
    "create empty data directory, dim.json and dim-lock.json",
    async () => {
      //  InitActionを実行
      await new InitAction().execute({});

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

Deno.test("InstallAction", async (t) => {
  //  通信など、制御下に無いものをmock化
  Deno.chdir(temporaryDirectory);
  Deno.writeTextFileSync(
    "dim.json",
    JSON.stringify({ fileVersion: "1.1", contents: [] }),
  );

  //  URLを指定したパターン
  await t.step("with URL", async (t) => {
    //  正常系
    await t.step(
      "download with headers, and save it to data_files, dim.json and dim-lock.json",
      async () => {
        //    InstallActionを実行
        await new InstallAction().execute(
          { postProcesses: [], name: "name", headers: [] },
          "https://www.city.shinjuku.lg.jp/content/000259916.zip",
        );
      },
    );

    //  name指定なし
    await t.step("exit with error when name is not specified", async () => {
    });

    //  指定したnameがインストール済み
    await t.step(
      "exit with error when specified name is already installed",
      async () => {
        //  ダミー用のdim.json作成
      },
    );

    //  通信中にエラー
    await t.step("exit with error when failed to download", async () => {
    });
  });

  //  URLを指定しないパターン
  await t.step("without URL", async (t) => {
  });

  //removeTemporaryFiles();
});
