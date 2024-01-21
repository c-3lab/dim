import { assert, assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { assertSpyCall, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { Colors, encoding, zipWrapper } from "../../deps.ts";
import { InstallAction } from "../../libs/actions.ts";
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import DenoWrapper from "../../libs/deno_wrapper.ts";
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
  let originalDirectory: string;
  let originalOS: "darwin" | "linux" | "windows";

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    consoleErrorStub = stub(console, "error");
    denoExitStub = stub(Deno, "exit");
    denoStdoutStub = stub(Deno.stdout, "write");
    fakeTime = new FakeTime("2022-01-02T03:04:05.678Z");
    originalDirectory = Deno.cwd();
    originalOS = DenoWrapper.build.os;
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    fakeTime.restore();
    denoStdoutStub.restore();
    denoExitStub.restore();
    consoleErrorStub.restore();
    consoleLogStub.restore();
    DenoWrapper.build.os = originalOS;
    Deno.chdir(originalDirectory);
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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

    it('exit with error when run with "name" not recorded in dim.json', async () => {
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
            integrity: "405906c9d5be6ae5393ca65fb0e7c38e0d585ecb",
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

    it("download using request headers and check that they are recorded in dim.json and dim-lock.json when specify headers option", async () => {
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
        const downloadedText = Deno.readTextFileSync(
          "data_files/encodeSjis/dummy.txt",
        );
        const expectedText = new TextDecoder().decode(
          Uint8Array.from(sjisBytesArray),
        );
        assertEquals(downloadedText, expectedText);

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
            integrity: "1ca77c31190bc266ef2288118edc677fed24b130",
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

    it("check that the command for darwin to extract the downloaded file is entered and recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      const denoRunStub = stub(Deno, "run", () => ({
        output: () => {},
        status: () => Promise.resolve({ success: true }),
        rid: 1,
      } as Deno.Process));
      DenoWrapper.build.os = "darwin";
      try {
        await new InstallAction().execute(
          { name: "unzip", postProcesses: ["unzip"] },
          "https://example.com/dummy.zip",
        );
        assert(fileExists("data_files/unzip/dummy.zip"));
        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: [
              "ditto",
              "-xk",
              "--sequesterRsrc",
              "./data_files/unzip/dummy.zip",
              "./data_files/unzip",
            ],
            stdout: "piped",
            stderr: "piped",
          }],
        });
        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "unzip",
            postProcesses: ["unzip"],
            url: "https://example.com/dummy.zip",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "unzip",
            path: "./data_files/unzip/dummy.zip",
            postProcesses: ["unzip"],
            url: "https://example.com/dummy.zip",
          }],
        });
      } finally {
        denoRunStub.restore();
        kyGetStub.restore();
      }
    });

    it("check that the decompress method is called with two arguments when the os is not darwin.", async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      const decompressStub = stub(zipWrapper, "decompress");
      DenoWrapper.build.os = "linux";
      try {
        await new InstallAction().execute(
          { name: "unzip", postProcesses: ["unzip"] },
          "https://example.com/dummy.zip",
        );
        assert(fileExists("data_files/unzip/dummy.zip"));
        assertSpyCall(decompressStub, 0, {
          args: ["./data_files/unzip/dummy.zip", "./data_files/unzip"],
        });
      } finally {
        decompressStub.restore();
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

    it('convert downloaded file from xlsx to csv and record in dim.json and dim-lock.json when specify "xlsx-to-csv" as postProcesses', async () => {
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
        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "xlsx-to-csv",
            postProcesses: ["xlsx-to-csv"],
            url: "https://example.com/dummy.xlsx",
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
            integrity: "775287470f019036b49c1bc3438e9fcc08839eb6",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "xlsx-to-csv",
            path: "./data_files/xlsx-to-csv/dummy.xlsx",
            postProcesses: ["xlsx-to-csv"],
            url: "https://example.com/dummy.xlsx",
          }],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('convert downloaded file from xls to csv and record in dim.json and dim-lock.json when specify "xlsx-to-csv" as postProcesses', async () => {
      createEmptyDimJson();
      const testXlsx = Deno.readFileSync("../test_data/test.xls");
      const kyGetStub = createKyGetStub(testXlsx);
      try {
        await new InstallAction().execute(
          { name: "xlsx-to-csv", postProcesses: ["xlsx-to-csv"] },
          "https://example.com/dummy.xls",
        );
        assert(fileExists("data_files/xlsx-to-csv/dummy.xls"));
        const testData = Deno.readTextFileSync(
          "data_files/xlsx-to-csv/dummy.csv",
        );
        assertEquals(testData, "a,b\nc,d\ne,f\n");
        assertSpyCall(consoleLogStub, 0, { args: ["Convert xlsx to csv."] });
        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "xlsx-to-csv",
            postProcesses: ["xlsx-to-csv"],
            url: "https://example.com/dummy.xls",
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
            integrity: "f66551793c54c4af590dc406d0a3811a92aea645",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "xlsx-to-csv",
            path: "./data_files/xlsx-to-csv/dummy.xls",
            postProcesses: ["xlsx-to-csv"],
            url: "https://example.com/dummy.xls",
          }],
        });
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

    it('convert downloaded file from csv to json and record in dim.json and dim-lock.json when specify "csv-to-json" as postProcess', async () => {
      createEmptyDimJson();
      const textCsv = Deno.readFileSync("../test_data/valid_csv.csv");
      const kyGetStub = createKyGetStub(textCsv);
      try {
        await new InstallAction().execute(
          { name: "csv-to-json", postProcesses: ["csv-to-json"] },
          "https://example.com/dummy.csv",
        );
        assert(fileExists("data_files/csv-to-json/dummy.csv"));
        const testData = Deno.readTextFileSync(
          "data_files/csv-to-json/dummy.json",
        );
        assertEquals(testData, '[{"aaa":"12","bbb":"34","ccc":"56"},{"aaa":"10","bbb":"20","ccc":"30"}]');
        assertSpyCall(consoleLogStub, 0, { args: ["Convert csv to json."] });
        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "csv-to-json",
            postProcesses: ["csv-to-json"],
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
            headers: {},
            integrity: "2c294b4e8b9fd5a0e520f712f108451975cbbded",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "csv-to-json",
            path: "./data_files/csv-to-json/dummy.csv",
            postProcesses: ["csv-to-json"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when specify "csv-to-json a" as postProcess and download', async () => {
      createEmptyDimJson();
      const kyGetStub = createKyGetStub("dummy");
      try {
        await new InstallAction().execute(
          { name: "csv-to-jsona", postProcesses: ["csv-to-json a"] },
          "https://example.com/dummy.csv",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.red("error: Too many arguments:"),
            Colors.red("csv-to-json a"),
          ],
        });
        assert(fileExists("data_files/csv-to-jsona/dummy.csv"));
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

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "cmdecho",
            postProcesses: ["cmd echo"],
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "cmdecho",
            path: "./data_files/cmdecho/dummy.txt",
            postProcesses: ["cmd echo"],
            url: "https://example.com/dummy.txt",
          }],
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
          args: [Colors.red("Can not use -f option and URL at the same time.")],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when execute with URL and PageInsall option", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-install.html", import.meta.url).toString();
      try {
        await new InstallAction().execute(
          { pageInstall: testPage },
          "https://example.com/dummy.txt",
        );
        assertSpyCall(denoExitStub, 0, { args: [1] });
        assertSpyCall(consoleLogStub, 0, {
          args: [Colors.red("Cannot use -P option and URL at the same time.")],
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
        Deno.copyFileSync(
          "../test_data/installed-dim-lock.json",
          "dim-lock.json",
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
            Colors.red("Selecting other than json."),
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
    it("exits with error when if the URL is incorrectly described. ", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        const dimData: DimJSON = {
          fileVersion: "1.1",
          contents: [
            {
              name: "test1",
              url: "invalid",
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
        await new InstallAction().execute({ file: "./dim.json" }, undefined);
        assertSpyCall(denoExitStub, 0, {
          args: [1],
        });
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red("Failed to process."),
            Colors.red("Invalid URL"),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });
    it("exits with error when if the URL is incorrectly described and asynchronous installation. ", async () => {
      const kyGetStub = createKyGetStub("dummy");
      try {
        const dimData: DimJSON = {
          fileVersion: "1.1",
          contents: [
            {
              name: "test1",
              url: "invalid",
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
        await new InstallAction().execute({ file: "./dim.json", asyncInstall: true }, undefined);
        assertSpyCall(denoExitStub, 0, {
          args: [1],
        });
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red("Failed to process."),
            Colors.red("Invalid URL"),
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
        assert(fileExists("./data_files/test3/dummy.zip"));
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
        Deno.copyFileSync(
          "../test_data/installed-dim-lock.json",
          "dim-lock.json",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: "2022-02-03T04:05:06.000Z",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
            integrity: "829c3804401b0727f70f73d4415e162400cbe57b",
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
        const dimJson = JSON.parse(Deno.readTextFileSync("./dim.json"));
        assertEquals(
          dimJson,
          JSON.parse(
            Deno.readTextFileSync("./../test_data/external-dim.json"),
          ),
        );

        const dimLockJson = JSON.parse(
          Deno.readTextFileSync("./dim-lock.json"),
        );
        assertEquals(
          dimLockJson,
          JSON.parse(
            Deno.readTextFileSync("./../test_data/installed-from-internet-dim-lock.json"),
          ),
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

  describe("with pageInstall", () => {
    it("download all link in specified page.", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-install.html", import.meta.url).toString();
      try {
        createEmptyDimJson();
        await new InstallAction().execute(
          { pageInstall: testPage, expression: "l", name: "pageInstallTest" },
          undefined,
        );

        assert(fileExists("data_files/pageInstallTest_1/index.html"));
        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "pageInstallTest_1",
            postProcesses: [],
            url: "https://example.com/index.html",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "pageInstallTest_2",
            postProcesses: [],
            url: "https://example.net/index.html",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "pageInstallTest_3",
            postProcesses: [],
            url: "https://example.invalid/index.html",
          }, {
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "pageInstallTest_4",
            postProcesses: [],
            url: "https://example.org/index.html",
          }],
        });

        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.green("Installed to ./data_files/pageInstallTest_1/index.html"),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when file is specified", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-install.html", import.meta.url).toString();

      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          { pageInstall: testPage, file: "l" },
          undefined,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [Colors.red("Can not use -f option and -P option at the same time.")],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when expression is not specified", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-install.html", import.meta.url).toString();

      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          { pageInstall: testPage },
          undefined,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [Colors.red("Can not use -P option without -e option.")],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when name is not specified", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-install.html", import.meta.url).toString();

      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          { pageInstall: testPage, expression: "l" },
          undefined,
        );
        assertSpyCall(consoleLogStub, 0, {
          args: [Colors.red("The -n option is not specified.")],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when expression is invalid", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-install.html", import.meta.url).toString();

      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          { pageInstall: testPage, expression: "(", name: "pageInstallTest" },
          undefined,
        );
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red(
              "Failed to pageInstall.",
            ),
            Colors.red(
              "Invalid regular expression: /(/: Unterminated group",
            ),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when can't read html", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-empty.html", import.meta.url).toString();

      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          { pageInstall: testPage, expression: "l", name: "pageInstallTest" },
          undefined,
        );
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when fetch response", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-install.notfound", import.meta.url).toString();
      console.log(testPage);

      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          { pageInstall: testPage, expression: "l", name: "pageInstallTest" },
          undefined,
        );
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red(
              "Failed to pageInstall.",
            ),
            Colors.red(
              "NetworkError when attempting to fetch resource.",
            ),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyGetStub.restore();
      }
    });

    it("exit with error when page invalid", async () => {
      const kyGetStub = createKyGetStub("dummy");
      const testPage = new URL("../test_data/test-page-invalid.html", import.meta.url).toString();
      const errorHref = new URL("../test_data/l///", import.meta.url).toString();

      try {
        createEmptyDimJson();

        await new InstallAction().execute(
          { pageInstall: testPage, expression: "l", name: "pageInstallTest" },
          undefined,
        );
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red(
              "Failed to pageInstall.",
            ),
            Colors.red(
              "target:" + errorHref,
            ),
            Colors.red(
              "Is a directory (os error 21), open './data_files/pageInstallTest_1/'",
            ),
          ],
        });
        assertSpyCall(consoleLogStub, 0, {
          args: [Colors.green("Completed page install 0 files.")],
        });
      } finally {
        kyGetStub.restore();
      }
    });
  });
});
