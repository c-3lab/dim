import {
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.152.0/testing/asserts.ts";
import {
  assertSpyCall,
  Stub,
  stub,
} from "https://deno.land/std@0.152.0/testing/mock.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { Colors } from "../../deps.ts";
import { UninstallAction } from "../../libs/actions.ts";
import {
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
} from "../../libs/consts.ts";
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import {
  fileExists,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";

describe("UninstallAction", () => {
  let consoleLogStub: Stub;
  let consoleErrorStub: Stub;
  let denoExitStub: Stub;

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    consoleErrorStub = stub(console, "error");
    denoExitStub = stub(Deno, "exit");
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    denoExitStub.restore();
    consoleErrorStub.restore();
    consoleLogStub.restore();
  });

  it("delete the downloaded data and check that dim.json and dim-lock.json have been rewritten.", async () => {
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
        postProcesses: ["encoding-utf-8"],
        url: "https://example.com/dummy.txt",
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
    Deno.mkdirSync("data_files/test1", { recursive: true });
    Deno.writeTextFileSync("./data_files/test1/dummy.txt", "dummy");

    await new UninstallAction().execute(undefined as void, "test1");

    assertFalse(fileExists("./data_files/test1/dummy.txt"));
    const dimJson = JSON.parse(Deno.readTextFileSync(DEFAULT_DIM_FILE_PATH));
    assertEquals(dimJson, {
      fileVersion: "1.1",
      contents: [],
    });
    const dimLockJson = JSON.parse(
      Deno.readTextFileSync(DEFAULT_DIM_LOCK_FILE_PATH),
    );
    assertEquals(dimLockJson, {
      lockFileVersion: "1.1",
      contents: [],
    });
  });

  it('exit with error when run with "name" not recorded in dim.json', async () => {
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
        postProcesses: ["encoding-utf-8"],
        url: "https://example.com/dummy.txt",
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

    await new UninstallAction().execute(undefined as void, "example");

    assertSpyCall(consoleLogStub, 0, {
      args: [
        Colors.red("Faild to remove. Not Found a content in the dim.json."),
      ],
    });
    assertSpyCall(consoleLogStub, 1, {
      args: [
        Colors.red(
          "Faild to remove. Not Found a content in the dim-lock.json.",
        ),
      ],
    });
  });
});
