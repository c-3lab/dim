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
import { Colors, encoding } from "../../deps.ts";
import { InstallAction } from "../../libs/actions.ts";
import {
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DIM_FILE_VERSION,
} from "../../libs/consts.ts";
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import {
  createKyGetStub,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";

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
    fakeTime = new FakeTime("2022-01-02T03:04:05.678Z");
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
    it("download and check that data_files, dim.json and dim-lock.json are saved.", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "example" },
          "https://example.com/dummy.txt",
        );
        assertEquals(
          await fileExists(
            "data_files/example/dummy.txt",
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
            url: "https://example.com/dummy.txt",
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
            lastModified: null,
            name: "example",
            path: "./data_files/example/dummy.txt",
            postProcesses: [],
            url: "https://example.com/dummy.txt",
          }],
        });

        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.green("Installed to ./data_files/example/dummy.txt"),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when name is not specified", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          {},
          "https://example.com/dummy.txt",
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [Colors.red("The -n option is not specified.")],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when specified name is already installed", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
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
        await new InstallAction().execute(
          { name: "installedName1" },
          "https://example.com/dummy.txt",
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
      } finally {
        kyGetStub.restore();
      }
    });

    it('check whether existing files are overwritten if "name" is duplicated in the "force" option.', async () => {
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
      Deno.mkdirSync("data_files/installedName2", { recursive: true });
      Deno.writeTextFileSync("data_files/installedName2/dummy.csv", "before");

      const kyGetStub = createKyGetStub("after", {
        headers: {
          "etag": '"12345-1234567890abc"',
          "last-modified": "Thu, 3 Feb 2022 04:05:06 GMT",
        },
      });
      try {
        await new InstallAction().execute(
          { name: "installedName2", force: true },
          "https://example.com/dummy.csv",
        );

        const fileContent = Deno.readTextFileSync(
          "data_files/installedName2/dummy.csv",
        );
        assertEquals(fileContent, "after");

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "installedName2",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            eTag: "12345-1234567890abc",
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: "2022-02-03T04:05:06.000Z",
            name: "installedName2",
            path: "./data_files/installedName2/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.green(
              "Installed to ./data_files/installedName2/dummy.csv",
            ),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("download using request headers and check that they are recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();

      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "Header", headers: ["key: value"] },
          "https://example.com/dummy.csv",
        );

        assertEquals(kyGetStub.calls[0].args[1].headers, { "key": "value" });
        assertEquals(
          await fileExists(
            "data_files/Header/dummy.csv",
          ),
          true,
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: { key: "value" },
            name: "Header",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            eTag: null,
            headers: { key: "value" },
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "Header",
            path: "./data_files/Header/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-8" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("テストデータ");
      try {
        const utf8Bytes = new TextEncoder().encode("テストデータ");
        const sjisBytesArray = encoding.convert(utf8Bytes, {
          from: "UTF8",
          to: "SJIS",
        });
        Deno.writeFileSync("test.txt", Uint8Array.from(sjisBytesArray));

        await new InstallAction().execute(
          { name: "encodeSjis", postProcesses: ["encode sjis"] },
          "https://example.com/dummy.txt",
        );
        assertEquals(
          await fileExists(
            "data_files/encodeSjis/dummy.txt",
          ),
          true,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "Converted encoding to",
            "SJIS",
          ],
        });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            Colors.green(
              "Installed to ./data_files/encodeSjis/dummy.txt",
            ),
          ],
        });
        const testTxt = Deno.readTextFileSync("test.txt");
        const downloadTxt = Deno.readTextFileSync(
          "data_files/encodeSjis/dummy.txt",
        );
        assertEquals(testTxt, downloadTxt);

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "encodeSjis",
            postProcesses: ["encode sjis"],
            url: "https://example.com/dummy.txt",
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
            lastModified: null,
            name: "encodeSjis",
            path: "./data_files/encodeSjis/dummy.txt",
            postProcesses: ["encode sjis"],
            url: "https://example.com/dummy.txt",
          }],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "encode utf-8 sjis" in "postProcess", and download', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "encodeUtf8Sjis", postProcesses: ["encode utf-8 sjis"] },
          "https://example.com/dummy.txt",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red(
              "error: Too many arguments:",
            ),
            Colors.red(
              "encode utf-8 sjis",
            ),
          ],
        });
        assertEquals(
          await fileExists(
            "data_files/encodeUtf8Sjis/dummy.txt",
          ),
          true,
        );
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "encode" in "postProcess", and download.', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "encode", postProcesses: ["encode"] },
          "https://example.com/dummy.txt",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red(
              "Argument not specified.",
            ),
          ],
        });
        assertEquals(
          await fileExists(
            "data_files/encode/dummy.txt",
          ),
          true,
        );
      } finally {
        kyGetStub.restore();
      }
    });

    it("if the OS is linux, confirm that the command to extract the downloaded file is entered and that it is recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      const denoRunStub = stub(Deno, "run");
      try {
        await new InstallAction().execute(
          { name: "unzip", postProcesses: ["unzip"] },
          "https://example.com/dummy.zip",
        );
        assertEquals(
          await fileExists(
            "data_files/unzip/dummy.zip",
          ),
          true,
        );
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["unzip", "./data_files/unzip/dummy.zip", "-d", "./"],
          }],
        });
      } finally {
        denoRunStub.restore();
        kyGetStub.restore();
      }
    });
    //darwin
    it.ignore("if the OS is darwin, confirm that the command to extract the downloaded file is entered and that it is recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      const denoRunStub = stub(Deno, "run");
      const denoBuildOsStub = stub(Deno.build, "os");
      try {
        await new InstallAction().execute(
          { name: "unzip", postProcesses: ["unzip"] },
          "https://example.com/dummy.zip",
        );
        assertEquals(
          await fileExists(
            "data_files/unzip/dummy.zip",
          ),
          true,
        );
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: [
              "ditto",
              "-xk",
              "--sequesterRsrc",
              "data_files/unzip/dummy.zip",
              "data_files/unzip",
            ],
          }],
        });
      } finally {
        kyGetStub.restore();
        denoRunStub.restore();
        denoBuildOsStub.restore();
      }
    });

    it('exit with error when specify "unzip a" in "postProcess" and download', async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "unzipa", postProcesses: ["unzip a"] },
          "https://example.com/dummy.zip",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertEquals(
          await fileExists(
            "data_files/unzipa/dummy.zip",
          ),
          true,
        );
      } finally {
        kyGetStub.restore();
      }
    });

    it("after downloading, convert the xlsx file to a csv file and check that it is recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "xlsx-to-csv", postProcesses: ["xlsx-to-csv"] },
          "https://example.com/dummy.xlsx",
        );
        assertEquals(
          await fileExists(
            "data_files/xlsx-to-csv/dummy.csv",
          ),
          true,
        );
        assertSpyCall(consoleLogStub, 0, { args: ["Convert xlsx to csv."] });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "xlsx-to-csv a" in "postProcess" and download', async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "xlsx-to-csv a", postProcesses: ["xlsx-to-csv a"] },
          "https://example.com/dummy.xlsx",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertEquals(
          await fileExists(
            "data_files/xlsx-to-csv a/dummy.xlsx",
          ),
          true,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red(
              "error: Too many arguments:",
            ),
            Colors.red(
              "xlsx-to-csv a",
            ),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("confirm that when a file is downloaded, the path to the downloaded data is recorded in the standard output in data_files, dim.json and dim-lock.json.", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const denoRunStub = stub(Deno, "run");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "cmdecho", postProcesses: ["cmd echo"] },
          "https://example.com/dummy.txt",
        );
        assertEquals(
          await fileExists(
            "data_files/cmdecho/dummy.txt",
          ),
          true,
        );
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["echo", "./data_files/cmdecho/dummy.txt"],
            stdout: "piped",
          }],
        });
      } finally {
        kyGetStub.restore();
        denoRunStub.restore();
      }
    });

    it('download the file and verify that the path to the downloaded data, prefixed with "a", is output to standard output and record in dim.json, dim-lock.json', async () => {
      const denoRunStub = stub(Deno, "run");
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "cmdechoa", postProcesses: ["cmd echo a"] },
          "https://example.com/dummy.txt",
        );
        assertEquals(
          await fileExists(
            "data_files/cmdechoa/dummy.txt",
          ),
          true,
        );
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["echo", "a", "./data_files/cmdechoa/dummy.txt"],
            stdout: "piped",
          }],
        });
      } finally {
        kyGetStub.restore();
        denoRunStub.restore();
      }
    });

    it('exit with error when specify "cmd" for "postProcess" and download', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "cmd", postProcesses: ["cmd"] },
          "https://example.com/dummy.txt",
        );
        assertEquals(
          await fileExists(
            "data_files/cmd/dummy.txt",
          ),
          true,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red(
              "No command entered",
            ),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "cmd aaa" for "postProcess" and download', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "ecmd aaa", postProcesses: ["cmd aaa"] },
          "https://example.com/dummy.txt",
        );
        assertEquals(
          await fileExists(
            "data_files/ecmd aaa/dummy.txt",
          ),
          true,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "Execute Command: ",
            [
              "aaa",
            ],
            "./data_files/ecmd aaa/dummy.txt",
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "aaa" in "postProcess" and download', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "aaa", postProcesses: ["aaa"] },
          "https://example.com/dummy.txt",
        );
        assertEquals(
          await fileExists(
            "data_files/aaa/dummy.txt",
          ),
          true,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: ["No support a postprocess 'aaa' ''."],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when failed to download", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "invalidURL" },
          "aaa",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleErrorStub, 0, {
          args: [Colors.red("Failed to install."), Colors.red("Invalid URL")],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when execute with URL and -f ", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { file: "./../test-dim.json" },
          "https://example.com/dummy.txt",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [Colors.red("Cannot use -f option and URL at the same time.")],
        });
      } finally {
        kyGetStub.restore();
      }
    });
  });

  describe("without URL", () => {
    it("Run with an empty dim.json and confirm that you are asked to download data", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          {},
          undefined,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "No contents.\nYou should run a 'dim install <data url>'. ",
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when Runs without dim.json", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute({}, undefined);
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "Not found a dim.json. You should run a 'dim init'. ",
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("download the data from the locally existing dim.json and ensure that it is recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { file: "./../test-dim.json" },
          undefined,
        );
        const dimJson = JSON.parse(Deno.readTextFileSync("./../test-dim.json"));
        assertEquals(dimJson, JSON.parse(Deno.readTextFileSync("./dim.json")));
      } finally {
        kyGetStub.restore();
      }
    });

    it("download from locally existing all-data-installed dim.json and check that it is recorded in dim.json and dim-lock.json.", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        const dimLockData: DimLockJSON = {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: new Date(),
            lastModified: null,
            name: "test1",
            path: "./data_files/test1/dummy.txt",
            postProcesses: ["encoding-utf-8"],
            url: "https://example.com/dummy.txt",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: new Date(),
            lastModified: null,
            name: "test2",
            path: "./data_files/test2/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: new Date(),
            lastModified: null,
            name: "test3",
            path: "./data_files/test3/dummy.zip",
            postProcesses: [],
            url: "https://example.com/dummy.zip",
          }],
        };
        await Deno.writeTextFile(
          DEFAULT_DIM_LOCK_FILE_PATH,
          JSON.stringify(dimLockData, null, 2),
        );
        await new InstallAction().execute(
          { file: "./../test-dim.json" },
          undefined,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: ["All contents have already been installed."],
        });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            "Use the -F option to force installation and overwrite existing files.",
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exits with error when If a path other than the locally existing dim.json is specified, the program", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { file: "./../helper.ts" },
          undefined,
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: ["Not found a dim.json. You should run a 'dim init'. "],
        });
      } finally {
        kyGetStub.restore();
      }
    });
    it("exits with error when run with no difference between dim.json and dim-lock.json", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        const dimData: DimJSON = {
          fileVersion: DIM_FILE_VERSION,
          contents: [
            {
              name: "test1",
              url: "https://example.com/dummy.test",
              catalogUrl: null,
              catalogResourceId: null,
              postProcesses: [],
              headers: {},
            },
          ],
        };
        const dimLockData: DimLockJSON = {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: new Date(),
            lastModified: null,
            name: "test1",
            path: "./data_files/test1/dummy.txt",
            postProcesses: ["encoding-utf-8"],
            url: "https://example.com/dummy.txt",
          }],
        };
        await Deno.writeTextFile(
          DEFAULT_DIM_LOCK_FILE_PATH,
          JSON.stringify(dimLockData, null, 2),
        );
        await Deno.writeTextFile(
          DEFAULT_DIM_FILE_PATH,
          JSON.stringify(dimData, null, 2),
        );
        await new InstallAction().execute({}, undefined);
        assertSpyCall(consoleLogStub, 0, {
          args: ["All contents have already been installed."],
        });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            "Use the -F option to force installation and overwrite existing files.",
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    //  install済みのデータがある状態で-Fを指定し実行
    it("Run with no differences between dim.json and dim-lock.json and check that a forced re-download is performed.", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        const dimData: DimJSON = {
          "fileVersion": "1.1",
          "contents": [
            {
              name: "test1",
              url: "https://example.com/dummy.txt",
              catalogUrl: null,
              catalogResourceId: null,
              postProcesses: [
                "encoding-utf-8",
              ],
              headers: {},
            },
            {
              name: "test2",
              url: "https://example.com/dummy.csv",
              catalogUrl: null,
              catalogResourceId: null,
              postProcesses: [],
              headers: {},
            },
            {
              url: "https://example.com/dummy.zip",
              name: "test3",
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
        await new InstallAction().execute({ force: true }, undefined);
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
            lastModified: null,
            name: "test1",
            path: "./data_files/test1/dummy.txt",
            postProcesses: ["encoding-utf-8"],
            url: "https://example.com/dummy.txt",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "test2",
            path: "./data_files/test2/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "test3",
            path: "./data_files/test3/dummy.zip",
            postProcesses: [],
            url: "https://example.com/dummy.zip",
          }],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it(
      "ensure asynchronous processing during multiple data installations.",
      async () => {
        const kyGetStub = createKyGetStub("dummy");
        try {
          const dimData: DimJSON = {
            "fileVersion": "1.1",
            "contents": [
              {
                name: "test1",
                url: "https://example.com/dummy.txt",
                catalogUrl: null,
                catalogResourceId: null,
                postProcesses: [
                  "encoding-utf-8",
                ],
                headers: {},
              },
              {
                name: "test2",
                url: "https://example.com/dummy.csv",
                catalogUrl: null,
                catalogResourceId: null,
                postProcesses: [],
                headers: {},
              },
              {
                url: "https://example.com/dummy.zip",
                name: "test3",
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
          await new InstallAction().execute(
            { force: true, asyncInstall: true },
            undefined,
          );
          const dimLockJson = JSON.parse(
            Deno.readTextFileSync("dim-lock.json"),
          );
          assertEquals(dimLockJson, {
            lockFileVersion: "1.1",
            contents: [{
              catalogResourceId: null,
              catalogUrl: null,
              eTag: null,
              headers: {},
              integrity: "",
              lastDownloaded: "2022-01-02T03:04:05.678Z",
              lastModified: null,
              name: "test1",
              path: "./data_files/test1/dummy.txt",
              postProcesses: ["encoding-utf-8"],
              url: "https://example.com/dummy.txt",
            }, {
              catalogResourceId: null,
              catalogUrl: null,
              eTag: null,
              headers: {},
              integrity: "",
              lastDownloaded: "2022-01-02T03:04:05.678Z",
              lastModified: null,
              name: "test2",
              path: "./data_files/test2/dummy.csv",
              postProcesses: [],
              url: "https://example.com/dummy.csv",
            }, {
              catalogResourceId: null,
              catalogUrl: null,
              eTag: null,
              headers: {},
              integrity: "",
              lastDownloaded: "2022-01-02T03:04:05.678Z",
              lastModified: null,
              name: "test3",
              path: "./data_files/test3/dummy.zip",
              postProcesses: [],
              url: "https://example.com/dummy.zip",
            }],
          });
        } finally {
          kyGetStub.restore();
        }
      },
    );

    it(
      "download the difference between the dim.json that exists on the Internet and the dim.json that exists in the current directory and check that it is recorded in dim.json, dim-lock.json.",
      async () => {
        const dimJson = Deno.readTextFileSync("./../test-dim.json");
        const kyGetStub = createKyGetStub(dimJson.replace(/[\n\s]/g, ""));
        try {
          createEmptyDimJson();
          await new InstallAction().execute(
            {
              file: "https://example.com/dummy.json",
            },
            undefined,
          );
          const dimJson = JSON.parse(
            Deno.readTextFileSync("./../test-dim.json"),
          );
          assertEquals(
            dimJson,
            JSON.parse(Deno.readTextFileSync("./dim.json")),
          );
        } finally {
          kyGetStub.restore();
        }
      },
    );

    it(
      "exit with error when run by specifying a non-dim.json file that exists on the Internet",
      async () => {
        const kyGetStub = createKyGetStub("dummy");
        try {
          let error = "";
          await new InstallAction().execute(
            {
              file: "https://example.com/dummy.json",
            },
            undefined,
          ).catch((e) => {
            error = e.message;
          });
          assertMatch(error, /.*(is not valid JSON)$/);
        } finally {
          kyGetStub.restore();
        }
      },
    );

    it("call dim.ts and execute it in command line form.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        const p = Deno.run({
          cmd: [
            "deno",
            "run",
            "--allow-read",
            "--allow-write",
            "--allow-net",
            "../../dim.ts",
            "install",
          ],
          stdout: "piped",
        });
        console.log(new TextDecoder().decode(await p.output()));
        p.close();
      } finally {
        kyGetStub.restore();
      }
    });
  });
});
