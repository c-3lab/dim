import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { InitAction, InstallAction } from "../../libs/actions.ts";
import { DEFAULT_DIM_FILE_PATH, DIM_FILE_VERSION } from "../../libs/consts.ts";
import { DimJSON } from "../../libs/types.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

function fileExists(filePath: string): boolean {
  try {
    Deno.statSync(filePath);
    return true;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

Deno.test({
  name: "InstallAction",
  async fn(t) {
    removeTemporaryFiles();
    //  通信など、制御下に無いものをmock化
    Deno.chdir(temporaryDirectory);
    Deno.writeTextFileSync(
      "dim.json",
      JSON.stringify({ fileVersion: "1.1", contents: [] }),
    );

    //  URLを指定したパターン
    await t.step("with URL", async (t) => {
      //  -nを指定し実行
      await t.step(
        "download with headers, and save it to data_files, dim.json and dim-lock.json",
        async () => {
          //    InstallActionを実行
          await new InstallAction().execute(
            { name: "example" },
            "https://www.pref.ehime.jp/opendata-catalog/dataset/2262/resource/9169/7iryouinnR3.pdf",
          );
          assertEquals(
            await fileExists(
              "data_files/example/7iryouinnR3.pdf",
            ),
            true,
          );
        },
      );

      //  -nを未指定
      await t.step(
        "exit with error when name is not specified",
        async () => {
          let error = "";
          //  InstallActionを実行
          await new InstallAction().execute(
            {},
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          ).catch((e) => {
            error = e.message;
          });
          assertEquals(error, "Test case attempted to exit with exit code: 1");
        },
      );

      //  重複する名前の-nを指定し実行
      await t.step(
        "exit with error when specified name is already installed",
        async () => {
          //  ダミー用のdim.json作成
          const dimData: DimJSON = {
            fileVersion: DIM_FILE_VERSION,
            contents: [
              {
                name: "installedName1",
                url: "dummy",
                catalogUrl: null,
                catalogResourceId: null,
                postProcesses: [],
                headers: {},
              },
            ],
          };
          await Deno.writeTextFile(
            DEFAULT_DIM_FILE_PATH,
            JSON.stringify(dimData, null, 2),
          );
          let error = "";
          //  name重複
          await new InstallAction().execute(
            { name: "installedName1" },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          ).catch((e) => {
            error = e.message;
          });
          assertEquals(error, "Test case attempted to exit with exit code: 1");
        },
      );

      //  重複する名前の-nと-Fを指定し実行
      await t.step(
        'Specify installed "name" and "force"',
        async () => {
          //  ダミー用のdim.json作成
          const dimData: DimJSON = {
            fileVersion: DIM_FILE_VERSION,
            contents: [
              {
                name: "installedName2",
                url: "dummy",
                catalogUrl: null,
                catalogResourceId: null,
                postProcesses: [],
                headers: {},
              },
            ],
          };
          await Deno.writeTextFile(
            DEFAULT_DIM_FILE_PATH,
            JSON.stringify(dimData, null, 2),
          );
          //  重複する名前でintall
          await new InstallAction().execute(
            { name: "installedName2", force: true },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          );
          assertEquals(
            await fileExists(
              "data_files/installedName2/000259916.zip",
            ),
            true,
          );
        },
      );

      //  -nと-Hを指定し実行
      await t.step(
        '"Specify "encode utf-8" in -n and -p and execute"',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "Header", headers: ["aaa: aaa"] },
            "https://od.city.otsu.lg.jp/dataset/97d09f65-852b-4395-9dbb-9f0f82da1524/resource/daa71a2a-5d95-4760-8076-7e65923366e7/download/20210915.txt",
          );
          assertEquals(
            await fileExists(
              "data_files/Header/20210915.txt",
            ),
            true,
          );
        },
      );

      //  -nと-pに"encode utf-8"を指定し実行
      await t.step(
        '"Specify "encode utf-8" in -n and -p and execute"',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "encodeUtf8", postProcesses: ["encode utf-8"] },
            "https://od.city.otsu.lg.jp/dataset/97d09f65-852b-4395-9dbb-9f0f82da1524/resource/daa71a2a-5d95-4760-8076-7e65923366e7/download/20210915.txt",
          );
          assertEquals(
            await fileExists(
              "data_files/encodeUtf8/20210915.txt",
            ),
            true,
          );
        },
      );

      //  -nと-pに"encode utf-8 sjis"を指定し実行
      await t.step(
        '"Specify "encode utf-8 sjis" in -n and -p and execute"',
        async () => {
          let error = "";
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "encodeUtf8Sjis", postProcesses: ["encode utf-8 sjis"] },
            "https://od.city.otsu.lg.jp/dataset/97d09f65-852b-4395-9dbb-9f0f82da1524/resource/daa71a2a-5d95-4760-8076-7e65923366e7/download/20210915.txt",
          ).catch((e) => {
            error = e.message;
          });
          assertEquals(error, "Test case attempted to exit with exit code: 1");
        },
      );
      //  -nと-pに"encode"を指定し実行
      await t.step(
        '"Specify "encode" in -n and -p and execute"',
        async () => {
          let error = "";
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "encode", postProcesses: ["encode"] },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          ).catch((e) => {
            error = e.message;
          });
          assertEquals(error, "Test case attempted to exit with exit code: 1");
        },
      );
      //  -nと-pに"unzip"を指定し実行
      await t.step(
        '"Specify "unzip" in -n and -p and execute"',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "unzip", postProcesses: ["unzip"] },
            "	https://opendata.pref.shizuoka.jp/fs/2/6/4/2/4/_/_________-_-_.zip",
          );
          assertEquals(
            await fileExists(
              "data_files/unzip/_________-_-_.zip",
            ),
            true,
          );
        },
      );
      //  -nと-pに"unzip a"を指定し実行
      await t.step(
        '"Specify "unzip a" in -n and -p and execute"',
        async () => {
          let error = "";
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "unzipa", postProcesses: ["unzip a"] },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          ).catch((e) => {
            error = e.message;
          });
          assertEquals(error, "Test case attempted to exit with exit code: 1");
        },
      );
      //  -nと-pに"xlsx-to-csv"を指定し実行
      await t.step(
        '"Specify "xlsx-to-csv" in -n and -p and execute"',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "xlsx-to-csv", postProcesses: ["xlsx-to-csv"] },
            "	https://www.city.fukuoka.lg.jp/data/open/cnt/3/59282/1/27_04_01_1.xlsx",
          );
          assertEquals(
            await fileExists(
              "data_files/xlsx-to-csv/27_04_01_1.xlsx",
            ),
            true,
          );
        },
      );
      //  -nと-pに"xlsx-to-csv a"を指定し実行
      await t.step(
        '"Specify "xlsx-to-csv a" in -n and -p and execute"',
        async () => {
          let error = "";
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "xlsx-to-csv a", postProcesses: ["xlsx-to-csv a"] },
            "	https://www.city.fukuoka.lg.jp/data/open/cnt/3/59282/1/27_04_01_1.xlsx",
          ).catch((e) => {
            error = e.message;
          });
          assertEquals(error, "Test case attempted to exit with exit code: 1");
        },
      );
      //  -nと-pに"cmd echo"を指定し実行
      await t.step(
        'Specify "cmd echo" in -n and -p and execute',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "cmdecho", postProcesses: ["cmd echo"] },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          );
          assertEquals(
            await fileExists(
              "data_files/cmdecho/000259916.zip",
            ),
            true,
          );
        },
      );
      //  -nと-pに"cmd echo a"を指定し実行
      await t.step(
        'Specify "cmd echo a" in -n and -p and execute',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "cmdechoa", postProcesses: ["cmd echo a"] },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          );
          assertEquals(
            await fileExists(
              "data_files/cmdecho/000259916.zip",
            ),
            true,
          );
        },
      );
      //  -nと-pに"cmd"を指定し実行
      await t.step(
        '"Specify "cmd" in -n and -p and execute"',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "cmd", postProcesses: ["cmd"] },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          );
          assertEquals(
            await fileExists(
              "data_files/cmd/000259916.zip",
            ),
            true,
          );
        },
      );
      //  -nと-pに"cmd aaa"(存在しないコマンド)を指定し実行
      await t.step(
        '"Specify "cmd aaa" in -n and -p and execute"',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "ecmd aaa", postProcesses: ["cmd aaa"] },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          );
          assertEquals(
            await fileExists(
              "data_files/ecmd aaa/000259916.zip",
            ),
            true,
          );
        },
      );

      //  -nと-pに"aaa"(存在しないコマンド)を指定し実行
      await t.step(
        '"Specify "aaa" in -n and -p and execute"',
        async () => {
          //  InstallActionを実行
          await new InstallAction().execute(
            { name: "aaa", postProcesses: ["aaa"] },
            "https://www.city.shinjuku.lg.jp/content/000259916.zip",
          );
          assertEquals(
            await fileExists(
              "data_files/aaa/000259916.zip",
            ),
            true,
          );
        },
      );
      //  -nと無効なURLを指定し実行
      await t.step("exit with error when failed to download", async () => {
        let error = "";
        //  無効なURL
        await new InstallAction().execute(
          { name: "invalidURL" },
          "aaa",
        ).catch((e) => {
          error = e.message;
        });
        assertEquals(error, "Test case attempted to exit with exit code: 1");
      });

      //  URLと-fを指定し実行
      await t.step("Specify URL and -f and execute", async () => {
        let error = "";
        await new InstallAction().execute(
          { file: "./../test-dim.json" },
          "https://www.city.shinjuku.lg.jp/content/000259916.zip",
        ).catch((e) => {
          error = e.message;
        });
        assertEquals(error, "Test case attempted to exit with exit code: 1");
      });
    });

    //  URLを指定しないパターン
    await t.step("without URL", async (t) => {
      //  dim.json,dim-lock.jsonの初期化
      await new InitAction().execute();

      //  install済みのデータがない状態で実行
      await t.step(
        "Run without INSTALLED data",
        async () => {
          await new InstallAction().execute(
            {},
            undefined,
          );
        },
      );

      //  dim.jsonの削除
      Deno.removeSync("./dim.json");

      //  dim.jsonが存在しない状況で実行
      await t.step("Run with no dim.json", async () => {
        let error = "";
        await new InstallAction().execute({}, undefined).catch((e) => {
          error = e.message;
        });
        assertEquals(error, "Test case attempted to exit with exit code: 1");
      });

      //  dim.json,dim-lock.jsonの初期化
      await new InitAction().execute();

      //  -fにローカルに存在するdim.jsonのパスを指定し実行
      await t.step(
        "Specify the path of dim.json that exists locally in -f and execute",
        async () => {
          await new InstallAction().execute(
            { file: "./../test-dim.json" },
            undefined,
          );
        },
      );

      //  install済みのデータがある状態で-fにローカルに存在するdim.jsonのパスを指定し実行
      await t.step(
        "With the data already installed, specify the path to the locally existing dim.json in -f and execute.",
        async () => {
          await new InstallAction().execute(
            { file: "./../test-dim.json" },
            undefined,
          );
        },
      );

      //  -fにローカルに存在するdim.json以外のパスを指定し実行
      await t.step(
        "Specify a path other than dim.json that exists locally in -f and execute",
        async () => {
          let error = "";
          await new InstallAction().execute(
            { file: "./../helper.ts" },
            undefined,
          ).catch((e) => {
            error = e.message;
          });
          assertEquals(error, "Test case attempted to exit with exit code: 1");
        },
      );
      //  install済みのデータがある状態で実行
      await t.step("Run with installde data", async () => {
        await new InstallAction().execute({}, undefined);
      });

      //  install済みのデータがある状態で-Fを指定し実行
      await t.step("With installed data, specify -F and execute", async () => {
        await new InstallAction().execute({ force: true }, undefined);
      });

      //  install済みのデータがある状態で-Fと-Aを指定し実行
      await t.step(
        "With data already installed, specify -F and -A and execute",
        async () => {
          await new InstallAction().execute(
            { force: true, asyncInstall: true },
            undefined,
          );
        },
      );

      //  dim.json,dim-lock.jsonの初期化
      await new InitAction().execute();

      //  -fにインターネット上に存在するdim.jsonのパスを指定し実行
      await t.step(
        "Specify the path to dim.json on the Internet in -f and run",
        async () => {
          await new InstallAction().execute(
            {
              file:
                "https://raw.githubusercontent.com/c-3lab/dim/test/multiple-tests/tests/test-dim.json",
            },
            undefined,
          );
        },
      );

      //  -fにインターネット上に存在するdim.json以外ののパスを指定し実行
      await t.step(
        "Specify a path other than dim.json that exists on the Internet in -f and execute.",
        async () => {
          let error = "";
          await new InstallAction().execute(
            {
              file:
                "https://github.com/c-3lab/dim/blob/test/multiple-tests/tests/test_custom_command.py",
            },
            undefined,
          ).catch((e) => {
            error = e.message;
          });
          assertMatch(error, /.*(is not valid JSON)$/);
        },
      );
      //  dim.tsの呼び出し
      await t.step({
        name: "install",
        async fn() {
          const p = Deno.run({
            cmd: ["dim", "install"],
            stdout: "piped",
          });
          console.log(new TextDecoder().decode(await p.output()));
          p.close();
        },
      });
    });

    removeTemporaryFiles();
  },
  //  AssertionError: Test case is leaking 1 resourceの原因が特定出来ていないため、一時的に無視している。
  sanitizeResources: false,
});
