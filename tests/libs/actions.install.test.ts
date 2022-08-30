import {
  assert,
  assertEquals,
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
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import {
  createEmptyDimJson,
  createKyGetStub,
  fileExists,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";

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
    denoStdoutStub.restore();
    denoExitStub.restore();
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
        assert(fileExists("data_files/example/dummy.txt"));
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
          fileVersion: "1.1",
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
          "./dim.json",
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

    it("overwrite existing files when specified name is duplicated and force is true", async () => {
      const dimData: DimJSON = {
        fileVersion: "1.1",
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
        "./dim.json",
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

    it("download using request headers and check that they are recorded in dim.json and dim-lock.json when specify headers option ", async () => {
      createEmptyDimJson();

      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "Header", headers: ["key: value"] },
          "https://example.com/dummy.csv",
        );

        assertEquals(kyGetStub.calls[0].args[1].headers, { "key": "value" });
        assert(fileExists("data_files/Header/dummy.csv"));

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

    it('encode downloaded file to Shift-JIS and record in dim.json, dim-lock.json when specify "encode sjis" as postProcesses', async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("テストデータ");
      try {
        await new InstallAction().execute(
          { name: "encodeSjis", postProcesses: ["encode sjis"] },
          "https://example.com/dummy.txt",
        );
        assert(fileExists("data_files/encodeSjis/dummy.txt"));
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
        const utf8Bytes = new TextEncoder().encode("テストデータ");
        const sjisBytesArray = encoding.convert(utf8Bytes, {
          from: "UTF8",
          to: "SJIS",
        });
        const downloadTxt = Deno.readTextFileSync(
          "data_files/encodeSjis/dummy.txt",
        );
        const test = new TextDecoder().decode(Uint8Array.from(sjisBytesArray));
        assertEquals(test, downloadTxt);

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

    it('exit with error when specify "encode utf-8 sjis" as postProcesses, and download', async () => {
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
        assert(fileExists("data_files/encodeUtf8Sjis/dummy.txt"));
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "encode" as postProcesses, and download.', async () => {
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
        assert(fileExists("data_files/encode/dummy.txt"));
      } finally {
        kyGetStub.restore();
      }
    });

    it("check that the command to extract the downloaded file is entered and recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      const denoRunStub = stub(Deno, "run");
      try {
        await new InstallAction().execute(
          { name: "unzip", postProcesses: ["unzip"] },
          "https://example.com/dummy.zip",
        );
        assert(fileExists("data_files/unzip/dummy.zip"));
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
    it('exit with error when specify "unzip a" as postProcess and download', async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "unzipa", postProcesses: ["unzip a"] },
          "https://example.com/dummy.zip",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red("error: Too many arguments:"),
            Colors.red("unzip a"),
          ],
        });
        assert(fileExists("data_files/unzipa/dummy.zip"));
      } finally {
        kyGetStub.restore();
      }
    });

    it.only('convert downloaded file from xlsx to csv and record in dim.json and dim-lock.json when specify "xlsx-to-csv" as postProcesses', async () => {
      createEmptyDimJson();
      const testXlsx = Deno.readFileSync("../test_data/test.xlsx");
      const kyGetStub = createKyGetStub(testXlsx);
      try {
        await new InstallAction().execute(
          { name: "xlsx-to-csv", postProcesses: ["xlsx-to-csv"] },
          "https://example.com/dummy.xlsx",
        );
        assert(fileExists("data_files/xlsx-to-csv/dummy.xlsx"));
        const testData = Deno.readTextFileSync(
          "data_files/xlsx-to-csv/dummy.csv",
        );
        assertEquals(testData, "a,b\nc,d\ne,f\n");
        assertSpyCall(consoleLogStub, 0, { args: ["Convert xlsx to csv."] });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "xlsx-to-csv a" as postProcesses and download', async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "xlsx-to-csva", postProcesses: ["xlsx-to-csv a"] },
          "https://example.com/dummy.xlsx",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assert(fileExists("data_files/xlsx-to-csva/dummy.xlsx"));
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

    it('download file and execute echo command with downloaded file path as standard output when specify "cmd echo" as postProcesses', async () => {
      const kyGetStub = createKyGetStub("dummy");
      const denoRunStub = stub(Deno, "run");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "cmdecho", postProcesses: ["cmd echo"] },
          "https://example.com/dummy.txt",
        );
        assert(fileExists("data_files/cmdecho/dummy.txt"));
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["echo", "./data_files/cmdecho/dummy.txt"],
            stdout: "piped",
          }],
        });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "Execute Command: ",
            ["echo"],
            "./data_files/cmdecho/dummy.txt",
          ],
        });
      } finally {
        kyGetStub.restore();
        denoRunStub.restore();
      }
    });

    it('download file and execute echo command with "a" and downloaded file path as standard output when specify "cmd echo a" as postProcesses', async () => {
      const denoRunStub = stub(Deno, "run");
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "cmdechoa", postProcesses: ["cmd echo a"] },
          "https://example.com/dummy.txt",
        );
        assert(fileExists("data_files/cmdechoa/dummy.txt"));
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["echo", "a", "./data_files/cmdechoa/dummy.txt"],
            stdout: "piped",
          }],
        });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "Execute Command: ",
            ["echo", "a"],
            "./data_files/cmdechoa/dummy.txt",
          ],
        });
      } finally {
        kyGetStub.restore();
        denoRunStub.restore();
      }
    });

    it('exit with error when specify "cmd" as postProcesses and download', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "cmd", postProcesses: ["cmd"] },
          "https://example.com/dummy.txt",
        );
        assert(fileExists("data_files/cmd/dummy.txt"));
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

    it('output log and ignore error when specify error command such as "cmd aaa" as postProcesses', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "ecmdaaa", postProcesses: ["cmd aaa"] },
          "https://example.com/dummy.txt",
        );
        assert(fileExists("data_files/ecmdaaa/dummy.txt"));
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "Execute Command: ",
            [
              "aaa",
            ],
            "./data_files/ecmdaaa/dummy.txt",
          ],
        });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            Colors.red(`Failed to execute the "aaa"\n`),
            Colors.red(`NotFound: No such file or directory (os error 2)`),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "aaa" as postProcess and download', async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "aaa", postProcesses: ["aaa"] },
          "https://example.com/dummy.txt",
        );
        assert(fileExists("data_files/aaa/dummy.txt"));
        assertSpyCall(consoleLogStub, 0, {
          args: ["No support a postprocess 'aaa' ''."],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when if the URL is incorrectly described.", async () => {
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

    it("exit with error when failed to download", async () => {
      const kyGetStub = createKyGetStub("Not found", { status: 404 });
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { name: "invalidURL" },
          "https://example.com/dummy.txt",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red("Failed to install."),
            Colors.red("Request failed with status code 404"),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when execute with URL and file path", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { file: "./../test_data/external-dim.json" },
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
    it("output the message for asking to download data when installed data is not exist and don't specify file path", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute({}, undefined);
        assertSpyCall(consoleLogStub, 0, {
          args: [
            "No contents.\nYou should run a 'dim install <data url>'. ",
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when runs without dim.json", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute({}, undefined);
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red("Not found a dim.json. You should run a 'dim init'. "),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("download data from locally existing dim.json and record in dim.json and dim-lock.json when specify file path", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { file: "./../test_data/external-dim.json" },
          undefined,
        );
        const dimJson = JSON.parse(
          Deno.readTextFileSync("./dim.json"),
        );
        assertEquals(
          dimJson,
          JSON.parse(Deno.readTextFileSync("./../test_data/external-dim.json")),
        );
        const dimLockJson = JSON.parse(
          Deno.readTextFileSync("./dim-lock.json"),
        );
        assertEquals(
          dimLockJson,
          JSON.parse(
            Deno.readTextFileSync("./../test_data/installed-dim-lock.json"),
          ),
        );
      } finally {
        kyGetStub.restore();
      }
    });

    it("download from locally existing all data installed dim.json and check that it is recorded in dim.json and dim-lock.json.", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        createEmptyDimJson();
        const dimLockData: DimLockJSON = JSON.parse(
          Deno.readTextFileSync("./../test_data/installed-dim-lock.json"),
        );
        await Deno.writeTextFile(
          "./dim-lock.json",
          JSON.stringify(dimLockData, null, 2),
        );
        await new InstallAction().execute(
          { file: "./../test_data/external-dim.json" },
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

    it("exits with error when specify non-existent file path", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { file: "./../test_data/invalid.txt" },
          undefined,
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red("Not found a dim.json. You should run a 'dim init'. "),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exits with error when installed data is exist", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        const dimData: DimJSON = {
          fileVersion: "1.1",
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
            postProcesses: ["encoding utf-8"],
            url: "https://example.com/dummy.txt",
          }],
        };
        await Deno.writeTextFile(
          "./dim.json",
          JSON.stringify(dimData, null, 2),
        );
        await Deno.writeTextFile(
          "./dim-lock.json",
          JSON.stringify(dimLockData, null, 2),
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

    it("run with a difference in dim.json and dim-lock.json and check that the missing dim-lock.json is downloaded.", async () => {
      const kyGetStub = createKyGetStub("dummy", {
        headers: {
          "etag": '"12345-1234567890abc"',
          "last-modified": "Thu, 3 Feb 2022 04:05:06 GMT",
        },
      });
      try {
        const dimData = JSON.parse(
          Deno.readTextFileSync("./../test_data/external-dim.json"),
        );
        await Deno.writeTextFile(
          "./dim.json",
          JSON.stringify(dimData, null, 2),
        );
        const dimLockData = {
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
            postProcesses: ["encoding utf-8"],
            url: "https://example.com/dummy.txt",
          }],
        };
        Deno.mkdirSync("data_files/test1", { recursive: true });
        await Deno.writeTextFile(
          "./data_files/test1/dummy.txt",
          "before",
        );

        await Deno.writeTextFile(
          "./dim-lock.json",
          JSON.stringify(dimLockData, null, 2),
        );

        await new InstallAction().execute({}, undefined);
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
            postProcesses: ["encoding utf-8"],
            url: "https://example.com/dummy.txt",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: "12345-1234567890abc",
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: "2022-02-03T04:05:06.000Z",
            name: "test2",
            path: "./data_files/test2/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: "12345-1234567890abc",
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: "2022-02-03T04:05:06.000Z",
            name: "test3",
            path: "./data_files/test3/dummy.zip",
            postProcesses: [],
            url: "https://example.com/dummy.zip",
          }],
        });

        const testData = Deno.readTextFileSync("./data_files/test1/dummy.txt");
        assertEquals(testData, "before");
      } finally {
        kyGetStub.restore();
      }
    });

    it("forced re-download when installed data is exist and force is true", async () => {
      const kyGetStub = createKyGetStub("dummy", {
        headers: {
          "etag": '"12345-1234567890abc"',
          "last-modified": "Thu, 3 Feb 2022 04:05:06 GMT",
        },
      });
      try {
        const dimData: DimJSON = JSON.parse(
          Deno.readTextFileSync("./../test_data/external-dim.json"),
        );
        await Deno.writeTextFile(
          "./dim.json",
          JSON.stringify(dimData, null, 2),
        );
        const dimLockData: DimLockJSON = JSON.parse(
          Deno.readTextFileSync("./../test_data/installed-dim-lock.json"),
        );
        await Deno.writeTextFile(
          "./dim-lock.json",
          JSON.stringify(dimLockData, null, 2),
        );
        await new InstallAction().execute({ force: true }, undefined);
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
            name: "test1",
            path: "./data_files/test1/dummy.txt",
            postProcesses: ["encoding utf-8"],
            url: "https://example.com/dummy.txt",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: "12345-1234567890abc",
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: "2022-02-03T04:05:06.000Z",
            name: "test2",
            path: "./data_files/test2/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            eTag: "12345-1234567890abc",
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: "2022-02-03T04:05:06.000Z",
            name: "test3",
            path: "./data_files/test3/dummy.zip",
            postProcesses: [],
            url: "https://example.com/dummy.zip",
          }],
        });

        assert(fileExists("./data_files/test3/dummy.zip"));
      } finally {
        kyGetStub.restore();
      }
    });

    it("check whether the asyncinstall option installs successfully", async () => {
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
                "encoding utf-8",
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
          "./dim.json",
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
            postProcesses: ["encoding utf-8"],
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

    it("download and record in dim.json, dim-lock.json when specified file path on Internet", async () => {
      const dimJson = Deno.readTextFileSync(
        "./../test_data/external-dim.json",
      );
      const kyGetStub = createKyGetStub(dimJson);
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          {
            file: "https://example.com/dim.json",
          },
          undefined,
        );
        const dimJson = JSON.parse(
          Deno.readTextFileSync("./../test_data/external-dim.json"),
        );
        assertEquals(
          dimJson,
          JSON.parse(Deno.readTextFileSync("./dim.json")),
        );
        const dimLockJson = JSON.parse(
          Deno.readTextFileSync("./../test_data/installed-dim-lock.json"),
        );
        assertEquals(
          dimLockJson,
          JSON.parse(Deno.readTextFileSync("./dim-lock.json")),
        );
        assert(fileExists("./data_files/test1/dummy.txt"));
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when specify non-dim.json file path on Internet", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          {
            file: "https://example.com/dummy.txt",
          },
          undefined,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red("Selecting other than json."),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

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
        const result = await p.output();
        p.close();
        assertEquals(
          new TextDecoder().decode(result),
          "No contents.\nYou should run a 'dim install <data url>'. \n",
        );
      } finally {
        kyGetStub.restore();
      }
    });
  });
});
