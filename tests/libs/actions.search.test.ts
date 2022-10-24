import {
  assert,
  assertEquals,
  assertFalse,
  assertStringIncludes,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { assertSpyCall, returnsNext, spy, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import { SearchAction } from "../../libs/actions.ts";
import {
  createEmptyDimJson,
  createKyGetStub,
  fileExists,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";
import { Confirm, encoding, Input, ky, Number } from "../../deps.ts";
import { DimFileAccessor } from "../../libs/accessor.ts";
import { Downloader } from "../../libs/downloader.ts";
import { Colors } from "../../deps.ts";
import { Content, DownlodedResult } from "../../libs/types.ts";

describe("SearchAction", () => {
  let consoleLogStub: Stub;
  let consoleErrorStub: Stub;
  let denoStdoutStub: Stub;
  let fakeTime: FakeTime;
  let originalDirectory: string;

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    consoleErrorStub = stub(console, "error");
    denoStdoutStub = stub(Deno.stdout, "write");
    fakeTime = new FakeTime("2022-01-02 03:04:05.678Z");
    originalDirectory = Deno.cwd();
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    fakeTime.restore();
    denoStdoutStub.restore();
    consoleErrorStub.restore();
    consoleLogStub.restore();
    Deno.chdir(originalDirectory);
  });

  describe("with keyword", () => {
    it("output results on the standard output.", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 10 },
          "避難所",
        );

        assertSpyCall(kyStub, 0, {
          args: [
            "https://search.ckan.jp/backend/api/package_search",
            {
              searchParams: new URLSearchParams(
                {
                  fq: `xckan_title:*避難所* OR tags:*避難所* OR x_ckan_description:*避難所*`,
                  rows: "10",
                },
              ),
            },
          ],
        });

        assertSpyCall(consoleLogStub, 0, { args: ["catalog_title1"] });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com/catalog1"),
          ],
        });
        assertSpyCall(consoleLogStub, 2, {
          args: [
            "  - Catalog Description:",
            Colors.green("catalog_description1"),
          ],
        });
        assertSpyCall(consoleLogStub, 3, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title1"),
          ],
        });
        assertSpyCall(consoleLogStub, 4, {
          args: ["    1.", "name1-1"],
        });
        assertSpyCall(consoleLogStub, 5, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/resource1-1/dummy.csv"),
          ],
        });
        assertSpyCall(consoleLogStub, 6, {
          args: [
            "      * Resource Description:",
            Colors.green("description1-1"),
          ],
        });
        assertSpyCall(consoleLogStub, 7, {
          args: [
            "      * Created             :",
            Colors.green("2018-10-26T05:45:55.266946"),
          ],
        });
        assertSpyCall(consoleLogStub, 8, {
          args: [
            "      * Format              :",
            Colors.green("CSV"),
          ],
        });
        assertSpyCall(consoleLogStub, 9, { args: [] });

        assertSpyCall(consoleLogStub, 10, { args: ["catalog_title2"] });
        assertSpyCall(consoleLogStub, 11, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com/catalog2"),
          ],
        });
        assertSpyCall(consoleLogStub, 12, {
          args: [
            "  - Catalog Description:",
            Colors.green("catalog_description2"),
          ],
        });
        assertSpyCall(consoleLogStub, 13, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title2"),
          ],
        });
        assertSpyCall(consoleLogStub, 14, {
          args: ["    2.", "name2-1"],
        });
        assertSpyCall(consoleLogStub, 15, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/resource2-1/dummy.zip"),
          ],
        });
        assertSpyCall(consoleLogStub, 16, {
          args: [
            "      * Resource Description:",
            Colors.green("description2-1"),
          ],
        });
        assertSpyCall(consoleLogStub, 17, {
          args: [
            "      * Created             :",
            Colors.green("2018-10-26T05:45:55.266946"),
          ],
        });
        assertSpyCall(consoleLogStub, 18, {
          args: [
            "      * Format              :",
            Colors.green("ZIP"),
          ],
        });
        assertSpyCall(consoleLogStub, 19, {
          args: ["    3.", "name2-2"],
        });
        assertSpyCall(consoleLogStub, 20, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/resource2-2/dummy.zip"),
          ],
        });
        assertSpyCall(consoleLogStub, 21, {
          args: [
            "      * Resource Description:",
            Colors.green("description2-2"),
          ],
        });
        assertSpyCall(consoleLogStub, 22, {
          args: [
            "      * Created             :",
            Colors.green("2018-10-26T05:45:55.266946"),
          ],
        });
        assertSpyCall(consoleLogStub, 23, {
          args: [
            "      * Format              :",
            Colors.green("ZIP"),
          ],
        });
        assertSpyCall(consoleLogStub, 24, { args: [] });

        assertSpyCall(consoleLogStub, 25, { args: ["catalog_title3"] });
        assertSpyCall(consoleLogStub, 26, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com/catalog3"),
          ],
        });
        assertSpyCall(consoleLogStub, 27, {
          args: [
            "  - Catalog Description:",
            Colors.green("catalog_description3"),
          ],
        });
        assertSpyCall(consoleLogStub, 28, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title3"),
          ],
        });
        assertSpyCall(consoleLogStub, 29, {
          args: ["    4.", "name3-1"],
        });
        assertSpyCall(consoleLogStub, 30, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/resource3-1/dummy.xlsx"),
          ],
        });
        assertSpyCall(consoleLogStub, 31, {
          args: [
            "      * Resource Description:",
            Colors.green("description3-1"),
          ],
        });
        assertSpyCall(consoleLogStub, 32, {
          args: [
            "      * Created             :",
            Colors.green("2018-10-26T05:45:55.266946"),
          ],
        });
        assertSpyCall(consoleLogStub, 33, {
          args: [
            "      * Format              :",
            Colors.green("XLSX"),
          ],
        });
        assertSpyCall(consoleLogStub, 34, { args: [] });
      } finally {
        kyStub.restore();
      }
    });

    it("null check of xckan_description, license_title, resources.", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData2.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 10 },
          "避難所",
        );

        assertSpyCall(kyStub, 0, {
          args: [
            "https://search.ckan.jp/backend/api/package_search",
            {
              searchParams: new URLSearchParams(
                {
                  fq: `xckan_title:*避難所* OR tags:*避難所* OR x_ckan_description:*避難所*`,
                  rows: "10",
                },
              ),
            },
          ],
        });

        assertSpyCall(consoleLogStub, 0, { args: ["catalog_title1"] });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com/catalog1"),
          ],
        });
        assertSpyCall(consoleLogStub, 2, {
          args: [
            "  - Catalog Description:",
            Colors.green(""),
          ],
        });
        assertSpyCall(consoleLogStub, 3, {
          args: [
            "  - Catalog License    :",
            Colors.green(""),
          ],
        });
        assertSpyCall(consoleLogStub, 4, {
          args: ["    1.", "name1-1"],
        });
        assertSpyCall(consoleLogStub, 5, {
          args: [
            "      * Resource URL        :",
            Colors.green(""),
          ],
        });
        assertSpyCall(consoleLogStub, 6, {
          args: [
            "      * Resource Description:",
            Colors.green(""),
          ],
        });
        assertSpyCall(consoleLogStub, 7, {
          args: [
            "      * Created             :",
            Colors.green(""),
          ],
        });
        assertSpyCall(consoleLogStub, 8, {
          args: [
            "      * Format              :",
            Colors.green(""),
          ],
        });
        assertSpyCall(consoleLogStub, 9, { args: [] });
      } finally {
        kyStub.restore();
      }
    });

    it("output results on the standard output when multiple keywords are specified.", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 10 },
          "避難所 東京",
        );

        assertSpyCall(kyStub, 0, {
          args: [
            "https://search.ckan.jp/backend/api/package_search",
            {
              searchParams: new URLSearchParams(
                {
                  fq: `xckan_title:(*避難所* AND *東京*) OR tags:(*避難所* AND *東京*) OR x_ckan_description:(*避難所* AND *東京*)`,
                  rows: "10",
                },
              ),
            },
          ],
        });
      } finally {
        kyStub.restore();
      }
    });

    it("exit with error when no results were obtained.", async () => {
      const denoExitStub = stub(Deno, "exit");
      const kyStub = createKyGetStub(
        JSON.stringify({ "result": { "results": [] } }),
      );
      try {
        await new SearchAction().execute(
          { number: 10 },
          "避難所 東京 神奈川",
        );

        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red(
              "There were no results matching your keywords.",
            ),
            Colors.red(
              "Please change the keyword and search again.",
            ),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyStub.restore();
        denoExitStub.restore();
      }
    });

    it("exit with error when failed to fetch search results", async () => {
      const denoExitSpy = spy(Deno, "exit");
      const kyStub = stub(
        ky,
        "get",
        () => {
          throw new Error("error in search process");
        },
      );
      try {
        await new SearchAction().execute(
          { number: 1 },
          "避難所",
        );
      } catch {
        //  Ignore exception from Deno.exit(1)
      } finally {
        kyStub.restore();
      }
      assertSpyCall(consoleErrorStub, 0, {
        args: [
          Colors.red("Failed to search."),
          Colors.red("error in search process"),
        ],
      });
      assertSpyCall(denoExitSpy, 0, { args: [1] });
      denoExitSpy.restore();
    });
  });

  describe("without keyword", () => {
    it("exit with error when no keyword is specified.", async () => {
      const p = Deno.run({
        cmd: [
          "deno",
          "run",
          "--allow-read",
          "--allow-write",
          "--allow-net",
          "../../dim.ts",
          "search",
        ],
        stdout: "null",
        stderr: "piped",
      });

      const stderrOutput = await p.stderrOutput();
      const actual = new TextDecoder().decode(stderrOutput);

      assertStringIncludes(actual, "Missing argument(s): keyword");
      p.close();
    });
  });

  describe("with n option", () => {
    it("get one result when specify 1 for the n option", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 1 },
          "避難所",
        );

        assertEquals(kyStub.calls[0].args[1].searchParams.get("rows"), "1");
      } finally {
        kyStub.restore();
      }
    });

    it('exit with error when if the value of "-n" is 0', async () => {
      const denoExitStub = stub(Deno, "exit");
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 0 },
          "避難所",
        );

        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red("Failed to search."),
            Colors.red("Please enter a number between 1 and 100"),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyStub.restore();
        denoExitStub.restore();
      }
    });

    it('exit with error when if the value of "-n" is -1', async () => {
      const denoExitStub = stub(Deno, "exit");
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: -1 },
          "避難所",
        );

        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red("Failed to search."),
            Colors.red("Please enter a number between 1 and 100"),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyStub.restore();
        denoExitStub.restore();
      }
    });

    it('exit with error when if the value of "-n" is 101', async () => {
      const denoExitStub = stub(Deno, "exit");
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 101 },
          "避難所",
        );

        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red("Failed to search."),
            Colors.red("Please enter a number between 1 and 100"),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        kyStub.restore();
        denoExitStub.restore();
      }
    });
  });

  describe("with i option", () => {
    it(
      "install when the search results contain catalogs with multiple resources",
      async () => {
        createEmptyDimJson();
        const numberStub = stub(
          Number,
          "prompt",
          () => Promise.resolve(4),
        );
        const inputStub = stub(
          Input,
          "prompt",
          () => Promise.resolve(""),
        );
        const confirmStub = stub(
          Confirm,
          "prompt",
          () => Promise.resolve(false),
        );

        const data = Deno.readTextFileSync("../test_data/searchData.json");
        const kyStub = createKyGetStub(data);

        try {
          await new SearchAction().execute(
            { number: 10, install: true },
            "避難所",
          );

          const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
          assertEquals(dimJson, {
            fileVersion: "1.1",
            contents: [{
              catalogResourceId: "resource3-1",
              catalogUrl: "https://example.com/catalog3",
              headers: {},
              name: "catalog_title3_name3-1",
              postProcesses: [],
              url: "https://example.com/resource3-1/dummy.xlsx",
            }],
          });

          const dimLockJson = JSON.parse(
            Deno.readTextFileSync("dim-lock.json"),
          );
          assertEquals(dimLockJson, {
            lockFileVersion: "1.1",
            contents: [{
              catalogResourceId: "resource3-1",
              catalogUrl: "https://example.com/catalog3",
              eTag: null,
              headers: {},
              integrity: "",
              lastDownloaded: "2022-01-02T03:04:05.678Z",
              lastModified: null,
              name: "catalog_title3_name3-1",
              path: "./data_files/catalog_title3_name3-1/dummy.xlsx",
              postProcesses: [],
              url: "https://example.com/resource3-1/dummy.xlsx",
            }],
          });
        } finally {
          numberStub.restore();
          inputStub.restore();
          confirmStub.restore();
          kyStub.restore();
        }
      },
    );

    it("set the name to dim.json, dim-lock.json When enter a name", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve("entered name"),
          Promise.resolve(""),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "entered name",
            postProcesses: [],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "entered name",
            path: "./data_files/entered name/dummy.csv",
            postProcesses: [],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("recorded in dim.json and dim-lock.json if install is true that the command to extract the downloaded files is entered.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(2),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("unzip"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      const denoRunStub = stub(
        Deno,
        "run",
        () => ({
          output: () => {},
          status: () => Promise.resolve({ success: true }),
          rid: 1,
        } as Deno.Process),
      );
      const denoCloseStub = stub(Deno, "close");

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        if (Deno.build.os === "darwin") {
          assertSpyCall(denoRunStub, 0, {
            args: [{
              cmd: [
                "ditto",
                "-xk",
                "--sequesterRsrc",
                "./data_files/catalog_title2_name2-1/dummy.zip",
                "./data_files/catalog_title2_name2-1",
              ],
              stdout: "piped",
              stderr: "piped",
            }],
          });
        } else {
          assertSpyCall(denoRunStub, 0, {
            args: [{
              cmd: [
                "unzip",
                "./data_files/catalog_title2_name2-1/dummy.zip",
                "-d",
                "./data_files/catalog_title2_name2-1",
              ],
            }],
          });
        }

        assert(fileExists("data_files/catalog_title2_name2-1/dummy.zip"));

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource2-1",
            catalogUrl: "https://example.com/catalog2",
            headers: {},
            name: "catalog_title2_name2-1",
            postProcesses: ["unzip"],
            url: "https://example.com/resource2-1/dummy.zip",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource2-1",
            catalogUrl: "https://example.com/catalog2",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title2_name2-1",
            path: "./data_files/catalog_title2_name2-1/dummy.zip",
            postProcesses: ["unzip"],
            url: "https://example.com/resource2-1/dummy.zip",
          }],
        });
      } finally {
        denoCloseStub.restore();
        denoRunStub.restore();
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("after downloading, save as csv file and record in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(4),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("xlsx-to-csv"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource3-1",
            catalogUrl: "https://example.com/catalog3",
            headers: {},
            name: "catalog_title3_name3-1",
            postProcesses: ["xlsx-to-csv"],
            url: "https://example.com/resource3-1/dummy.xlsx",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource3-1",
            catalogUrl: "https://example.com/catalog3",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title3_name3-1",
            path: "./data_files/catalog_title3_name3-1/dummy.xlsx",
            postProcesses: ["xlsx-to-csv"],
            url: "https://example.com/resource3-1/dummy.xlsx",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "euc-jp" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode euc-jp"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode euc-jp"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode euc-jp"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const eucjpBytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "EUCJP",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(eucjpBytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "iso-2022-jp" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode iso-2022-jp"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode iso-2022-jp"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode iso-2022-jp"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const jisBytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "JIS",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(jisBytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "shift_jis" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode shift_jis"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode shift_jis"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode shift_jis"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const sjisBytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "SJIS",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(sjisBytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-8" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode utf-8"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode utf-8"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode utf-8"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const utf8BytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "UTF8",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(utf8BytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-16" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode utf-16"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode utf-16"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode utf-16"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const utf16BytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "UTF16",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(utf16BytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-16be" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode utf-16be"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 11, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode utf-16be"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode utf-16be"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const utf16beBytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "UTF16BE",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(utf16beBytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-16le" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode utf-16le"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode utf-16le"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode utf-16le"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const utf16leBytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "UTF16LE",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(utf16leBytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "encode unicode" and record in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode unicode"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["encode unicode"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["encode unicode"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const uint8Array = new TextEncoder().encode(data);
        const unicodeBytesArray = encoding.convert(uint8Array, {
          from: "AUTO",
          to: "UNICODE",
        });
        assertEquals(
          Deno.readTextFileSync(
            "data_files/catalog_title1_name1-1/dummy.csv",
          ),
          new TextDecoder().decode(Uint8Array.from(unicodeBytesArray)),
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("execute specified command and display stdout as is when specify postprocess", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("cmd echo dummy"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      const denoRunSpy = spy(Deno, "run");

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "catalog_title1_name1-1",
            postProcesses: ["cmd echo dummy"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(
          Deno.readTextFileSync("dim-lock.json"),
        );
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "catalog_title1_name1-1",
            path: "./data_files/catalog_title1_name1-1/dummy.csv",
            postProcesses: ["cmd echo dummy"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        assertSpyCall(denoRunSpy, 0, {
          args: [{
            cmd: [
              "echo",
              "dummy",
              "./data_files/catalog_title1_name1-1/dummy.csv",
            ],
            stdout: "piped",
          }],
        });

        assertSpyCall(consoleLogStub, 35, {
          args: [
            "Execute Command: ",
            [
              "echo",
              "dummy",
            ],
            "./data_files/catalog_title1_name1-1/dummy.csv",
          ],
        });

        assertSpyCall(consoleLogStub, 36, {
          args: [
            "dummy ./data_files/catalog_title1_name1-1/dummy.csv\n",
          ],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
        denoRunSpy.restore();
      }
    });

    it("exit with error when duplicate names.", async () => {
      const denoExitStub = stub(Deno, "exit");
      createEmptyDimJson();
      const content: Content = {
        url: "http://example.com",
        name: "name duplication check",
        headers: {},
        postProcesses: [],
        catalogResourceId: null,
        catalogUrl: null,
      };
      await new DimFileAccessor().addContent(content);
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve("name duplication check"),
          Promise.resolve(""),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        assertSpyCall(consoleLogStub, 35, {
          args: [
            "The name already exists.",
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
        denoExitStub.restore();
      }
    });

    it("check the arguments passed to number.prompt", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise.resolve(""),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        assertSpyCall(numberStub, 0, {
          args: [
            {
              message: "Enter the number of data to install",
              min: 1,
              max: 4,
            },
          ],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("check the arguments passed to input.prompt", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise.resolve(""),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const [nameInputPromptMessage, nameInputPromptValidate] = Object.values(
          inputStub.calls[0].args[0],
        );
        assertEquals(
          nameInputPromptMessage,
          "Enter the name. Enter blank if want to use CKAN resource name.",
        );
        assert(nameInputPromptValidate("test"));
        assertFalse(nameInputPromptValidate("!?"));

        const [
          postprocessInputPromptMessage,
          postprocessInputPromptHint,
          postprocessInputPromptValidate,
        ] = Object.values(inputStub.calls[1].args[0]);
        assertEquals(
          postprocessInputPromptMessage,
          "Enter the post-processing you want to add. Enter blank if not required.",
        );
        assertEquals(
          postprocessInputPromptHint,
          "(ex.: > unzip, xlsx-to-csv, encode utf-8 or cmd [some cli command])",
        );
        assert(postprocessInputPromptValidate(""));
        assert(postprocessInputPromptValidate("cmd "));
        assert(postprocessInputPromptValidate("unzip"));
        assert(postprocessInputPromptValidate("xlsx-to-csv"));
        assert(postprocessInputPromptValidate("encode euc-jp"));
        assert(postprocessInputPromptValidate("encode iso-2022-jp"));
        assert(postprocessInputPromptValidate("encode shift_jis"));
        assert(postprocessInputPromptValidate("encode utf-8"));
        assert(postprocessInputPromptValidate("encode utf-16"));
        assert(postprocessInputPromptValidate("encode utf-16be"));
        assert(postprocessInputPromptValidate("encode utf-16le"));
        assert(postprocessInputPromptValidate("encode unicode"));
        assertFalse(postprocessInputPromptValidate("test"));
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("check the arguments passed to confirm.prompt", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve(""),
          Promise.resolve("encode utf-8"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        assertSpyCall(confirmStub, 0, {
          args: [
            {
              message: "Is there a post-processing you would like to add next?",
              default: true,
            },
          ],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("checking that processing is performed correctly when specify multiple postprocesses", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise.resolve("entered name"),
          Promise.resolve("encode utf-8"),
          Promise.resolve("encode utf-16"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        returnsNext([
          Promise.resolve(true),
          Promise.resolve(false),
        ]),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            headers: {},
            name: "entered name",
            postProcesses: ["encode utf-8", "encode utf-16"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com/catalog1",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "entered name",
            path: "./data_files/entered name/dummy.csv",
            postProcesses: ["encode utf-8", "encode utf-16"],
            url: "https://example.com/resource1-1/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("check whether to terminate in the event of a communication error", async () => {
      const denoExitStub = stub(Deno, "exit");
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise.resolve(""),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise.resolve(false),
      );
      const downloaderStub = stub(
        Downloader.prototype,
        "download",
        (
          _url: URL,
          _name: string,
          _headers?: Record<string, string>,
        ): Promise<DownlodedResult> => {
          throw new Error("Error in install process");
        },
      );
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red("Failed to install."),
            Colors.red("Error in install process"),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        downloaderStub.restore();
        kyStub.restore();
        denoExitStub.restore();
      }
    });
  });
});
