import { assertEquals, assertFalse } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { assertSpyCall, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { Colors } from "../../deps.ts";
import { UninstallAction } from "../../libs/actions.ts";
import { DEFAULT_DIM_FILE_PATH, DEFAULT_DIM_LOCK_FILE_PATH } from "../../libs/consts.ts";
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import { fileExists, removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

describe("UninstallAction", () => {
  let consoleLogStub: Stub;
  let denoExitStub: Stub;
  let originalDirectory: string;

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    denoExitStub = stub(Deno, "exit");
    originalDirectory = Deno.cwd();
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    consoleLogStub.restore();
    denoExitStub.restore();
    Deno.chdir(originalDirectory);
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
  it("runs with a name when dim-lock.json does not exsist", async () => {
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
    await Deno.writeTextFile(
      DEFAULT_DIM_FILE_PATH,
      JSON.stringify(dimData, null, 2),
    );
    await new UninstallAction().execute(undefined as void, "test1");
    assertSpyCall(consoleLogStub, 0, {
      args: [Colors.green("Removed a content from the dim.json.")],
    });
    assertSpyCall(consoleLogStub, 1, {
      args: ["Not found a dim-lock.json"],
    });
    assertSpyCall(denoExitStub, 0, { args: [1] });
  });

  it("runs without dim.json and dim-lock.json", async () => {
    await new UninstallAction().execute(undefined as void, "dummy");
    assertSpyCall(consoleLogStub, 0, {
      args: [Colors.red("Not found a dim.json. You should run a 'dim init'. ")],
    });
    assertSpyCall(denoExitStub, 0, { args: [1] });
  });

  it("runs with a name not recorded in dim.json or dim-lock.json and displays an error message.", async () => {
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
        Colors.red("Failed to remove. Not Found a content in the dim.json."),
      ],
    });
    assertSpyCall(consoleLogStub, 1, {
      args: [
        Colors.red(
          "Failed to remove. Not Found a content in the dim-lock.json.",
        ),
      ],
    });
  });
  it("runs with a path not found in data_files and displays an error message.", async () => {
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

    await new UninstallAction().execute(undefined as void, "test1");

    assertSpyCall(consoleLogStub, 0, {
      args: [
        Colors.green("Removed a content from the dim.json."),
      ],
    });
    assertSpyCall(consoleLogStub, 1, {
      args: [
        Colors.green("Removed a content from the dim-lock.json."),
      ],
    });
    assertSpyCall(consoleLogStub, 2, {
      args: [
        Colors.red("Failed to remove a file './data_files/test1/dummy.txt'."),
      ],
    });
  });
});
