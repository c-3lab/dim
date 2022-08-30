import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
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
import { UpdateAction } from "../../libs/actions.ts";
import {
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DIM_FILE_VERSION,
  DIM_LOCK_FILE_VERSION,
} from "../../libs/consts.ts";
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import {
  createKyGetStub,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";

const createEmptyDimJson = () => {
  Deno.writeTextFileSync(
    DEFAULT_DIM_FILE_PATH,
    JSON.stringify({ fileVersion: DIM_FILE_VERSION, contents: [] }),
  );
  Deno.writeTextFileSync(
    DEFAULT_DIM_LOCK_FILE_PATH,
    JSON.stringify({ lockfileVersion: DIM_LOCK_FILE_VERSION, contents: [] }),
  );
};

describe("UpdateAction", () => {
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

  describe("with name", () => {
    it('confirm that dim.json and dim-lock.json have been updated by running dim.json with the "name" listed in dim.json.', async () => {
      const dimData: DimJSON = {
        fileVersion: DIM_FILE_VERSION,
        contents: [
          {
            name: "example",
            url: "dummy",
            catalogUrl: null,
            catalogResourceId: null,
            postProcesses: [],
            headers: {},
          },
        ],
      };
      const dimLockData: DimLockJSON = {
        lockFileVersion: DIM_LOCK_FILE_VERSION,
        contents: [{
          catalogResourceId: null,
          catalogUrl: null,
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: new Date("2020-01-02T03:04:05.678Z"),
          lastModified: null,
          name: "example",
          path: "./data_files/example/dummy.csv",
          postProcesses: [],
          url: "https://example.com/dummy.csv",
        }],
      };
      await Deno.writeTextFile(
        DEFAULT_DIM_FILE_PATH,
        JSON.stringify(dimData, null, 2),
      );
      await Deno.writeTextFile(
        DEFAULT_DIM_LOCK_FILE_PATH,
        JSON.stringify(dimLockData, null, 2),
      );
      Deno.mkdirSync("data_files/example", { recursive: true });
      Deno.writeTextFileSync("data_files/example/dummy.csv", "before");

      const kyGetStub = createKyGetStub("after", {
        headers: {
          "etag": '"12345-1234567890abc"',
          "last-modified": "Thu, 3 Feb 2022 04:05:06 GMT",
        },
      });
      try {
        await new UpdateAction().execute({}, "example");

        const fileContent = Deno.readTextFileSync(
          "data_files/example/dummy.csv",
        );
        assertEquals(fileContent, "after");

        const dimJson = JSON.parse(
          Deno.readTextFileSync(DEFAULT_DIM_FILE_PATH),
        );
        assertEquals(dimJson, {
          fileVersion: DIM_FILE_VERSION,
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            headers: {},
            name: "example",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(
          Deno.readTextFileSync(DEFAULT_DIM_LOCK_FILE_PATH),
        );
        assertEquals(dimLockJson, {
          lockFileVersion: DIM_LOCK_FILE_VERSION,
          contents: [{
            catalogResourceId: null,
            catalogUrl: null,
            eTag: "12345-1234567890abc",
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: "2022-02-03T04:05:06.000Z",
            name: "example",
            path: "./data_files/example/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        assertSpyCall(consoleLogStub, 0, {
          args: [
            Colors.green(
              "Updated example.",
            ),
            "\nFile path:",
            Colors.yellow(
              "./data_files/example/dummy.csv",
            ),
          ],
        });
      } finally {
        kyGetStub.restore();
      }
    });

    it('exit with error when run with "name" not listed in dim-lock.json', async () => {
      createEmptyDimJson();
      await new UpdateAction().execute({}, "example2").catch(() => {
        assertSpyCall(consoleErrorStub, 0, {
          args: [
            Colors.red(
              "Faild to update. Not Found a content in the dim-lock.json. ",
            ),
          ],
        });
        assertSpyCall(denoExitStub, 0, { args: [1] });
      });
    });
  });

  describe("without name", () => {
    it("check that all data recorded in dim-lock.json is updated.", async () => {
      const kyGetStub = createKyGetStub("after", {
        headers: {
          "etag": '"12345-1234567890abc"',
          "last-modified": "Thu, 3 Feb 2022 04:05:06 GMT",
        },
      });
      try {
        Deno.mkdirSync("data_files/test1", { recursive: true });
        Deno.writeTextFileSync("data_files/test1/dummy.txt", "before");
        const dimData: DimJSON = {
          "fileVersion": DIM_FILE_VERSION,
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
        await new UpdateAction().execute({}, undefined);
        const dimLockJson = JSON.parse(
          Deno.readTextFileSync(DEFAULT_DIM_LOCK_FILE_PATH),
        );
        assertEquals(dimLockJson, {
          lockFileVersion: DIM_LOCK_FILE_VERSION,
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
            postProcesses: ["encoding-utf-8"],
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
        const fileContent = Deno.readTextFileSync(
          "data_files/test1/dummy.txt",
        );
        assertEquals(fileContent, "after");
      } finally {
        kyGetStub.restore();
      }
    });

    it("check that all data recorded in dim-lock.json is updated asynchronously.", async () => {
      const kyGetStub = createKyGetStub("after", {
        headers: {
          "etag": '"12345-1234567890abc"',
          "last-modified": "Thu, 3 Feb 2022 04:05:06 GMT",
        },
      });
      try {
        Deno.mkdirSync("data_files/test1", { recursive: true });
        Deno.writeTextFileSync("data_files/test1/dummy.txt", "before");
        const dimData: DimJSON = {
          "fileVersion": DIM_FILE_VERSION,
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
        await new UpdateAction().execute({ asyncInstall: true }, undefined);
        const dimLockJson = JSON.parse(
          Deno.readTextFileSync(DEFAULT_DIM_LOCK_FILE_PATH),
        );
        assertEquals(dimLockJson, {
          lockFileVersion: DIM_LOCK_FILE_VERSION,
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
            postProcesses: ["encoding-utf-8"],
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
        const fileContent = Deno.readTextFileSync(
          "data_files/test1/dummy.txt",
        );
        assertEquals(fileContent, "after");
      } finally {
        kyGetStub.restore();
      }
    });
  });
});
