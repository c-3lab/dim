import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";
import {
  assertSpyCall,
  returnsNext,
  Stub,
  stub,
} from "https://deno.land/std@0.152.0/testing/mock.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import { SearchAction } from "../../libs/actions.ts";
import {
  createKyGetStub,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";
import { Confirm, Input, Number } from "../../deps.ts";
import { DimFileAccessor } from "../../libs/accessor.ts";
import { Colors } from "../../deps.ts";

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

describe("SearchAction", () => {
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

  describe("with keyword", () => {
    it("check that the results are displayed on the standard output.", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 10 },
          "避難所",
        );

        const searchParams = new URLSearchParams(
          {
            fq: `xckan_title:*避難所* OR tags:*避難所* OR x_ckan_description:*避難所*`,
            rows: "10",
          },
        );
        assertEquals(kyStub.calls[0].args[1].searchParams, searchParams);

        assertSpyCall(consoleLogStub, 0, { args: ["xckan_title"] });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com"),
          ],
        });
        assertSpyCall(consoleLogStub, 2, {
          args: [
            "  - Catalog Description:",
            Colors.green("xckan_description"),
          ],
        });
        assertSpyCall(consoleLogStub, 3, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title"),
          ],
        });
        assertSpyCall(consoleLogStub, 4, {
          args: ["    1.", "name"],
        });
        assertSpyCall(consoleLogStub, 5, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.csv"),
          ],
        });
        assertSpyCall(consoleLogStub, 6, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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

        assertSpyCall(consoleLogStub, 10, { args: ["xckan_title"] });
        assertSpyCall(consoleLogStub, 11, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com"),
          ],
        });
        assertSpyCall(consoleLogStub, 12, {
          args: [
            "  - Catalog Description:",
            Colors.green("xckan_description"),
          ],
        });
        assertSpyCall(consoleLogStub, 13, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title"),
          ],
        });
        assertSpyCall(consoleLogStub, 14, {
          args: ["    2.", "name"],
        });
        assertSpyCall(consoleLogStub, 15, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.zip"),
          ],
        });
        assertSpyCall(consoleLogStub, 16, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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
          args: ["    3.", "name"],
        });
        assertSpyCall(consoleLogStub, 20, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.zip"),
          ],
        });
        assertSpyCall(consoleLogStub, 21, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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

        assertSpyCall(consoleLogStub, 25, { args: ["xckan_title"] });
        assertSpyCall(consoleLogStub, 26, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com"),
          ],
        });
        assertSpyCall(consoleLogStub, 27, {
          args: [
            "  - Catalog Description:",
            Colors.green("xckan_description"),
          ],
        });
        assertSpyCall(consoleLogStub, 28, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title"),
          ],
        });
        assertSpyCall(consoleLogStub, 29, {
          args: ["    4.", "name"],
        });
        assertSpyCall(consoleLogStub, 30, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.xlsx"),
          ],
        });
        assertSpyCall(consoleLogStub, 31, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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

    it("check whether results are displayed in the standard output when multiple keywords are specified.", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 10 },
          "避難所 東京",
        );

        const searchParams = new URLSearchParams(
          {
            fq:
              `xckan_title:(*避難所* AND *東京*) OR tags:(*避難所* AND *東京*) OR x_ckan_description:(*避難所* AND *東京*)`,
            rows: "10",
          },
        );
        assertEquals(kyStub.calls[0].args[1].searchParams, searchParams);

        assertSpyCall(consoleLogStub, 0, { args: ["xckan_title"] });
        assertSpyCall(consoleLogStub, 1, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com"),
          ],
        });
        assertSpyCall(consoleLogStub, 2, {
          args: [
            "  - Catalog Description:",
            Colors.green("xckan_description"),
          ],
        });
        assertSpyCall(consoleLogStub, 3, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title"),
          ],
        });
        assertSpyCall(consoleLogStub, 4, {
          args: ["    1.", "name"],
        });
        assertSpyCall(consoleLogStub, 5, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.csv"),
          ],
        });
        assertSpyCall(consoleLogStub, 6, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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

        assertSpyCall(consoleLogStub, 10, { args: ["xckan_title"] });
        assertSpyCall(consoleLogStub, 11, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com"),
          ],
        });
        assertSpyCall(consoleLogStub, 12, {
          args: [
            "  - Catalog Description:",
            Colors.green("xckan_description"),
          ],
        });
        assertSpyCall(consoleLogStub, 13, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title"),
          ],
        });
        assertSpyCall(consoleLogStub, 14, {
          args: ["    2.", "name"],
        });
        assertSpyCall(consoleLogStub, 15, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.zip"),
          ],
        });
        assertSpyCall(consoleLogStub, 16, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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
          args: ["    3.", "name"],
        });
        assertSpyCall(consoleLogStub, 20, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.zip"),
          ],
        });
        assertSpyCall(consoleLogStub, 21, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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

        assertSpyCall(consoleLogStub, 25, { args: ["xckan_title"] });
        assertSpyCall(consoleLogStub, 26, {
          args: [
            "  - Catalog URL        :",
            Colors.green("https://example.com"),
          ],
        });
        assertSpyCall(consoleLogStub, 27, {
          args: [
            "  - Catalog Description:",
            Colors.green("xckan_description"),
          ],
        });
        assertSpyCall(consoleLogStub, 28, {
          args: [
            "  - Catalog License    :",
            Colors.green("license_title"),
          ],
        });
        assertSpyCall(consoleLogStub, 29, {
          args: ["    4.", "name"],
        });
        assertSpyCall(consoleLogStub, 30, {
          args: [
            "      * Resource URL        :",
            Colors.green("https://example.com/dummy.xlsx"),
          ],
        });
        assertSpyCall(consoleLogStub, 31, {
          args: [
            "      * Resource Description:",
            Colors.green("description"),
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

    it("exit with error when display on stdout that results could not be obtained", async () => {
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
      }
    });
  });

  describe("with n option", () => {
    it("specify 1 for the n option", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);
      try {
        await new SearchAction().execute(
          { number: 1 },
          "避難所",
        );

        const searchParams = new URLSearchParams(
          {
            fq: `xckan_title:*避難所* OR tags:*避難所* OR x_ckan_description:*避難所*`,
            rows: "1",
          },
        );
        assertEquals(kyStub.calls[0].args[1].searchParams, searchParams);
      } finally {
        kyStub.restore();
      }
    });

    it('exit with error when if the value of "-n" is 0', async () => {
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
      }
    });

    it('exit with error when if the value of "-n" is -1', async () => {
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
      }
    });

    it('exit with error when if the value of "-n" is 101', async () => {
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
      }
    });
  });

  describe("with i option", () => {
    it(
      "check that the installation is performed correctly when there is a catalog with multiple resources in the search results",
      async () => {
        createEmptyDimJson();
        const numberStub = stub(
          Number,
          "prompt",
          () => Promise<number>.resolve(4),
        );
        const inputStub = stub(
          Input,
          "prompt",
          () => Promise<string>.resolve(""),
        );
        const confirmStub = stub(
          Confirm,
          "prompt",
          () => Promise<boolean>.resolve(false),
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
              catalogUrl: "https://example.com",
              headers: {},
              name: "xckan_title_name",
              postProcesses: [],
              url: "https://example.com/dummy.xlsx",
            }],
          });

          const dimLockJson = JSON.parse(
            Deno.readTextFileSync("dim-lock.json"),
          );
          assertEquals(dimLockJson, {
            lockFileVersion: "1.1",
            contents: [{
              catalogResourceId: "resource3-1",
              catalogUrl: "https://example.com",
              eTag: null,
              headers: {},
              integrity: "",
              lastDownloaded: "2022-01-02T03:04:05.678Z",
              lastModified: null,
              name: "xckan_title_name",
              path: "./data_files/xckan_title_name/dummy.xlsx",
              postProcesses: [],
              url: "https://example.com/dummy.xlsx",
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

    it("entered name is set to the name in dim.json, dim-lock.json", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise<string>.resolve("entered name"),
          Promise<string>.resolve(""),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "entered name",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "entered name",
            path: "./data_files/entered name/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("ensure that the command to extract the downloaded files is entered and recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(2),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("unzip"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      const denoRunStub = stub(Deno, "run");
      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        assertSpyCall(denoRunStub, 0, {
          args: [{
            cmd: ["unzip", "./data_files/unzip/dummy.zip", "-d", "./"],
          }],
        });
      } finally {
        denoRunStub.restore();
      }

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        assertEquals(
          await fileExists(
            "data_files/unzip/dummy.zip",
          ),
          true,
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource2-1",
            catalogUrl: "https://example.com",
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
            catalogResourceId: "resource2-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "unzip",
            path: "./data_files/unzip/dummy.zip",
            postProcesses: ["unzip"],
            url: "https://example.com/dummy.zip",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("after downloading, convert the xlsx file to a csv file and check that it is recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(4),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("xlsx-to-csv"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
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
            catalogResourceId: "resource3-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "xlsx-to-csv",
            path: "./data_files/xlsx-to-csv/dummy.xlsx",
            postProcesses: ["xlsx-to-csv"],
            url: "https://example.com/dummy.xlsx",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "euc-jp" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode euc-jp"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode euc-jp",
            postProcesses: ["encode euc-jp"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode euc-jp",
            path: "./data_files/encode euc-jp/dummy.csv",
            postProcesses: ["encode euc-jp"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "iso-2022-jp" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode iso-2022-jp"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode iso-2022-jp",
            postProcesses: ["encode iso-2022-jp"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode iso-2022-jp",
            path: "./data_files/encode iso-2022-jp/dummy.csv",
            postProcesses: ["encode iso-2022-jp"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "shift_jis" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode shift_jis"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode shift_jis",
            postProcesses: ["encode shift_jis"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode shift_jis",
            path: "./data_files/encode shift_jis/dummy.csv",
            postProcesses: ["encode shift_jis"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-8" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode utf-8"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode utf-8",
            postProcesses: ["encode utf-8"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode utf-8",
            path: "./data_files/encode utf-8/dummy.csv",
            postProcesses: ["encode utf-8"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-16" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode utf-16"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode utf-16",
            postProcesses: ["encode utf-16"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode utf-16",
            path: "./data_files/encode utf-16/dummy.csv",
            postProcesses: ["encode utf-16"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-16be" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode utf-16be"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode utf-16be",
            postProcesses: ["encode utf-16be"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode utf-16be",
            path: "./data_files/encode utf-16be/dummy.csv",
            postProcesses: ["encode utf-16be"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "utf-16le" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode utf-16le"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode utf-16le",
            postProcesses: ["encode utf-16le"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode utf-16le",
            path: "./data_files/encode utf-16le/dummy.csv",
            postProcesses: ["encode utf-16le"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "encode unicode" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode unicode"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode unicode",
            postProcesses: ["encode unicode"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode unicode",
            path: "./data_files/encode unicode/dummy.csv",
            postProcesses: ["encode unicode"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it(
      "ensure that the specified string and the path to the downloaded data are displayed on standard output and recorded in data_files, dim.json and dim-lock.json when the file is downloaded.",
      async () => {
        createEmptyDimJson();
        const numberStub = stub(
          Number,
          "prompt",
          () => Promise<number>.resolve(1),
        );
        const inputStub = stub(
          Input,
          "prompt",
          () => Promise<string>.resolve("cmd test"),
        );
        const confirmStub = stub(
          Confirm,
          "prompt",
          () => Promise<boolean>.resolve(false),
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
              catalogUrl: "https://example.com",
              headers: {},
              name: "cmd test",
              postProcesses: ["cmd test"],
              url: "https://example.com/dummy.csv",
            }],
          });

          const dimLockJson = JSON.parse(
            Deno.readTextFileSync("dim-lock.json"),
          );
          assertEquals(dimLockJson, {
            lockFileVersion: "1.1",
            contents: [{
              catalogResourceId: "resource1-1",
              catalogUrl: "https://example.com",
              eTag: null,
              headers: {},
              integrity: "",
              lastDownloaded: "2022-01-02T03:04:05.678Z",
              lastModified: null,
              name: "cmd test",
              path: "./data_files/cmd test/dummy.csv",
              postProcesses: ["cmd test"],
              url: "https://example.com/dummy.csv",
            }],
          });

          assertSpyCall(consoleLogStub, 35, {
            args: [
              "Execute Command: ",
              [
                "test",
              ],
              "./data_files/cmd test/dummy.csv",
            ],
          });
        } finally {
          numberStub.restore();
          inputStub.restore();
          confirmStub.restore();
          kyStub.restore();
        }
      },
    );

    it("exit with error when duplicate names.", async () => {
      createEmptyDimJson();
      await new DimFileAccessor().addContent(
        "http://example.com",
        "name duplication check",
        [],
        {},
      );
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("name duplication check"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
      }
    });

    it("check the arguments passed to number.prompt", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve(""),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const [message, min, max] = Object.values(numberStub.calls[0].args[0]);
        assertEquals(message, "Enter the number of the data to install");
        assertEquals(min, 1);
        assertEquals(max, 4);
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
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve(""),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
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
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => Promise<string>.resolve("encode utf-8"),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => Promise<boolean>.resolve(false),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data);

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const [message, defaultValue] = Object.values(
          confirmStub.calls[0].args[0],
        );

        assertEquals(
          message,
          "Is there a post-processing you would like to add next?",
        );
        assertEquals(defaultValue, true);
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it("checking that processing is performed correctly when confirm.prompt is set to yes or no", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => Promise<number>.resolve(1),
      );
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise<string>.resolve("entered name"),
          Promise<string>.resolve("encode utf-8"),
          Promise<string>.resolve("encode utf-16"),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        returnsNext([
          Promise<boolean>.resolve(true),
          Promise<boolean>.resolve(false),
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
            catalogUrl: "https://example.com",
            headers: {},
            name: "entered name",
            postProcesses: ["encode utf-8", "encode utf-16"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource1-1",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "entered name",
            path: "./data_files/entered name/dummy.csv",
            postProcesses: ["encode utf-8", "encode utf-16"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });
  });
});
