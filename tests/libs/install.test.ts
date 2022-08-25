import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";
import {
  assertSpyCall,
  Stub,
  stub,
} from "https://deno.land/std@0.152.0/testing/mock.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { Colors } from "../../deps.ts";
import { InstallAction } from "../../libs/actions.ts";
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

const createEmptyDimJson = () => {
  Deno.writeTextFileSync(
    "dim.json",
    JSON.stringify({ fileVersion: "1.1", contents: [] }),
  );
  Deno.writeTextFileSync(
    "dim-lock.json",
    JSON.stringify({ lockfileVersion: "1.1", contents: [] }),
  );
};

describe("InstallAction", () => {
  let consoleLogStub: Stub;
  let consoleErrorStub: Stub;
  let denoExitStub: Stub;
  let denoStdoutStub: Stub;
  let fakeTime: FakeTime;

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    consoleErrorStub = stub(console, "error");
    denoExitStub = stub(Deno, "exit");
    denoStdoutStub = stub(Deno.stdout, "write");
    fakeTime = new FakeTime("2022-01-02 03:04:05.678Z");
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    fakeTime.restore();
    denoExitStub.restore();
    denoStdoutStub.restore();
    consoleErrorStub.restore();
    consoleLogStub.restore();
  });

  describe("with URL", () => {
    it("download and save it to data_files, dim.json and dim-lock.json", async () => {
      createEmptyDimJson();

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
      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: null,
          catalogUrl: null,
          headers: {},
          name: "example",
          postProcesses: [],
          url:
            "https://www.pref.ehime.jp/opendata-catalog/dataset/2262/resource/9169/7iryouinnR3.pdf",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: null,
          catalogUrl: null,
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: "2021-10-26T03:02:14.000Z",
          name: "example",
          path: "./data_files/example/7iryouinnR3.pdf",
          postProcesses: [],
          url:
            "https://www.pref.ehime.jp/opendata-catalog/dataset/2262/resource/9169/7iryouinnR3.pdf",
        }],
      });

      assertSpyCall(consoleLogStub, 0, {
        args: [
          Colors.green("Installed to ./data_files/example/7iryouinnR3.pdf"),
        ],
      });
    });

    it("exit with error when name is not specified", async () => {
      createEmptyDimJson();

      await new InstallAction().execute(
        {},
        "https://www.city.shinjuku.lg.jp/content/000259916.zip",
      );
      assertSpyCall(consoleLogStub, 0, {
        args: [Colors.red("The -n option is not specified.")],
      });
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  重複する名前の-nを指定し実行
    it("exit with error when specified name is already installed", async () => {
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
      //  name重複
      await new InstallAction().execute(
        { name: "installedName1" },
        "https://www.city.shinjuku.lg.jp/content/000259916.zip",
      );
      assertSpyCall(consoleLogStub, 0, {
        args: [Colors.red("The name already exists.")],
      });
      assertSpyCall(consoleLogStub, 1, {
        args: [
          Colors.red(
            "Use the -F option to force installation and overwrite existing files.",
          ),
        ],
      });
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  重複する名前の-nと-Fを指定し実行
    it('overwrite already downloaded file if specify duplicated "name" with "force" option', async () => {
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

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: null,
          catalogUrl: null,
          headers: {},
          name: "installedName2",
          postProcesses: [],
          url: "https://www.city.shinjuku.lg.jp/content/000259916.zip",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: null,
          catalogUrl: null,
          eTag: "3a73f-5d5743bf7dec8",
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: "2022-01-13T10:34:42.000Z",
          name: "installedName2",
          path: "./data_files/installedName2/000259916.zip",
          postProcesses: [],
          url: "https://www.city.shinjuku.lg.jp/content/000259916.zip",
        }],
      });

      assertSpyCall(consoleLogStub, 0, {
        args: [
          Colors.green(
            "Installed to ./data_files/installedName2/000259916.zip",
          ),
        ],
      });
    });

    //  -nと-Hを指定し実行
    it("specify request headers and perform download, recording in dim.json and dim-lock.json", async () => {
      createEmptyDimJson();
      //  kyのStub化 : npm msw

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
    });

    //  -nと-pに"encode utf-8"を指定し実行
    it('specify "encode utf-8" in "postProcess", download the file, check that it is saved in data_files, dim.json, dim-lock.json, and confirm that the data is "utf-8"', async () => {
      createEmptyDimJson();
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
    });

    //  -nと-pに"encode utf-8 sjis"を指定し実行
    it('exit with error when specify "encode utf-8 sjis" in "postProcess", and download', async () => {
      createEmptyDimJson();
      //  InstallActionを実行
      await new InstallAction().execute(
        { name: "encodeUtf8Sjis", postProcesses: ["encode utf-8 sjis"] },
        "https://od.city.otsu.lg.jp/dataset/97d09f65-852b-4395-9dbb-9f0f82da1524/resource/daa71a2a-5d95-4760-8076-7e65923366e7/download/20210915.txt",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  -nと-pに"encode"を指定し実行
    it('exit with error when specify "encode" in "postProcess", and download.', async () => {
      createEmptyDimJson();
      //  InstallActionを実行
      await new InstallAction().execute(
        { name: "encode", postProcesses: ["encode"] },
        "https://www.city.shinjuku.lg.jp/content/000259916.zip",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  -nと-pに"unzip"を指定し実行(Deno.build.osがlinuxの場合)
    it('specify "unzip" in "postProcess", download files, save to data_files, dim.json, dim-lock.json, check if downloaded data is unpacked.', async () => {
      createEmptyDimJson();
      const denoRunStub = stub(Deno, "run");
      try {
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
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["unzip", "./data_files/unzip/_________-_-_.zip", "-d", "./"],
          }],
        });
      } finally {
        denoRunStub.restore();
      }
    });
    //  -nと-pに"unzip"を指定し実行(Deno.build.osがdarwinの場合)
    it("check standard output when deno.build.os is darwin", async () => {
      createEmptyDimJson();
      const denoRunStub = stub(Deno, "run");
      try {
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
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["unzip", "./data_files/unzip/_________-_-_.zip", "-d", "./"],
          }],
        });
      } finally {
        denoRunStub.restore();
      }
    });

    //  -nと-pに"unzip a"を指定し実行
    it('exit with error when specify "unzip a" in "postProcess" and download', async () => {
      createEmptyDimJson();
      //  InstallActionを実行
      await new InstallAction().execute(
        { name: "unzipa", postProcesses: ["unzip a"] },
        "https://www.city.shinjuku.lg.jp/content/000259916.zip",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  -nと-pに"xlsx-to-csv"を指定し実行
    it('specify "xlsx-to-csv" in "postProcess", download files, save to data_files, dim.json, dim-lock.json, check if downloaded data is converted to csv', async () => {
      createEmptyDimJson();
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
    });

    //  -nと-pに"xlsx-to-csv a"を指定し実行
    it('exit with error when specify "xlsx-to-csv a" in "postProcess" and download', async () => {
      createEmptyDimJson();
      //  InstallActionを実行
      await new InstallAction().execute(
        { name: "xlsx-to-csv a", postProcesses: ["xlsx-to-csv a"] },
        "	https://www.city.fukuoka.lg.jp/data/open/cnt/3/59282/1/27_04_01_1.xlsx",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  -nと-pに"cmd echo"を指定し実行
    it('specify "cmd echo" in "postProcess", download files, confirm that they are saved in data_files, dim.json, dim-lock.json, confirm that the path of downloaded data is output to standard output', async () => {
      createEmptyDimJson();
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
    });

    //  -nと-pに"cmd echo a"を指定し実行
    it('specify "cmd a" for "postProcess", download the file, and confirm that the path to the downloaded data is output to standard output with "a" at the beginning', async () => {
      createEmptyDimJson();
      //  InstallActionを実行
      await new InstallAction().execute(
        { name: "cmdechoa", postProcesses: ["cmd echo a"] },
        "https://www.city.shinjuku.lg.jp/content/000259916.zip",
      );
      assertEquals(
        await fileExists(
          "data_files/cmdechoa/000259916.zip",
        ),
        true,
      );
    });

    //  -nと-pに"cmd"を指定し実行
    it('exit with error when specify "cmd" for "postProcess" and download', async () => {
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
    });

    //  -nと-pに"cmd aaa"(存在しないコマンド)を指定し実行
    it('exit with error when specify "cmd aaa" for "postProcess" and download', async () => {
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
    });

    //  -nと-pに"aaa"(存在しないコマンド)を指定し実行
    it('exit with error when specify "aaa" in "postProcess" and download', async () => {
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
    });

    //  -nと無効なURLを指定し実行
    it("exit with error when failed to download", async () => {
      //  無効なURL
      await new InstallAction().execute(
        { name: "invalidURL" },
        "aaa",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  URLと-fを指定し実行
    it("exit with error when execute with URL and -f ", async () => {
      await new InstallAction().execute(
        { file: "./../test-dim.json" },
        "https://www.city.shinjuku.lg.jp/content/000259916.zip",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });
  });

  describe("without URL", () => {
    //  install済みのデータがない状態で実行
    it("Run with an empty dim.json and verify that a message appears prompting to download data", async () => {
      createEmptyDimJson();
      await new InstallAction().execute(
        {},
        undefined,
      );
    });

    //  dim.jsonが存在しない状況で実行
    it("exit with error when Runs without dim.json", async () => {
      await new InstallAction().execute({}, undefined);
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });

    //  -fにローカルに存在するdim.jsonのパスを指定し実行
    it("specify a locally existing dim.json, download data not listed in the dim.json that exists in the current directory, and save it to data_files, dim.json and dim-lock.json", async () => {
      createEmptyDimJson();
      await new InstallAction().execute(
        { file: "./../test-dim.json" },
        undefined,
      );
    });

    //  install済みのデータがある状態で-fにローカルに存在するdim.jsonのパスを指定し実行
    it("with no difference between the data stored in dim.json and dim-lock.json, specify the locally existing dim.json file and execute it to confirm that the output is correct.", async () => {
      //  TODO: tests/temporary以下にtest-dim.jsonを作成
      await new InstallAction().execute(
        { file: "./../test-dim.json" },
        undefined,
      );
    });

    //  -fにローカルに存在するdim.json以外のパスを指定し実行
    it("specify a locally existing dim.json, download data not listed in the dim.json that exists in the current directory, and save it to data_files, dim.json and dim-lock.json", async () => {
      await new InstallAction().execute(
        { file: "./../helper.ts" },
        undefined,
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
    });
    //  install済みのデータがある状態で実行
    it("run with no difference between the data stored in dim.json and dim-lock.json to check for correct output.", async () => {
      await new InstallAction().execute({}, undefined);
    });

    //  install済みのデータがある状態で-Fを指定し実行
    it('with no difference between the data stored in dim.json and dim-lock.json, specify "-F" and execute to confirm that the data recorded in dim.json has been downloaded.', async () => {
      await new InstallAction().execute({ force: true }, undefined);
    });

    //  install済みのデータがある状態で-Fと-Aを指定し実行
    it(
      'with no difference between the data stored in dim.json and dim-lock.json, specify "-F -A" and execute to confirm that the data recorded in dim.json has been downloaded.',
      async () => {
        await new InstallAction().execute(
          { force: true, asyncInstall: true },
          undefined,
        );
      },
    );

    //  -fにインターネット上に存在するdim.jsonのパスを指定し実行
    it(
      "specify a Internet existing dim.json, download data not listed in the dim.json that exists in the current directory, and save it to data_files, dim.json and dim-lock.json",
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
    it(
      "exit with error when run by specifying a non-dim.json file that exists on the Internet",
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
    it("call dim.ts and execute it in command line form.", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "--allow-write",
          "--allow-net",
          "../../dim.ts",
        ],
        stdout: "piped",
      });
      console.log(new TextDecoder().decode(await p.output()));
      p.close();
    });
  });
});
