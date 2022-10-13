import { assertSpyCall, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";

import { ListAction } from "../../libs/actions.ts";
import { createEmptyDimJson, removeTemporaryFiles, temporaryDirectory } from "../helper.ts";
import { DimLockJSON } from "../../libs/types.ts";
import { DEFAULT_DIM_LOCK_FILE_PATH } from "../../libs/consts.ts";
import { Colors } from "../../deps.ts";

describe("ListAction", () => {
  let consoleLogStub: Stub;
  let originalDirectory: string;

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    originalDirectory = Deno.cwd();
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    consoleLogStub.restore();
    Deno.chdir(originalDirectory);
  });

  it("display formatted information about installed data", async () => {
    createEmptyDimJson();
    const dimLockData: DimLockJSON = {
      lockFileVersion: "1.1",
      contents: [{
        catalogResourceId: "dummycatalogresourceid",
        catalogUrl: "https://www.example.com",
        eTag: "dummyetag",
        headers: {},
        integrity: "",
        lastDownloaded: new Date("2022-01-02T03:04:05.678Z"),
        lastModified: new Date("2022-01-02T03:04:05.678Z"),
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
    await new ListAction().execute({});

    assertSpyCall(consoleLogStub, 0, {
      args: ["test1"],
    });
    assertSpyCall(consoleLogStub, 1, {
      args: [
        "  - URL               :",
        Colors.green("https://example.com/dummy.txt"),
      ],
    });
    assertSpyCall(consoleLogStub, 2, {
      args: [
        "  - Name              :",
        Colors.green("test1"),
      ],
    });
    assertSpyCall(consoleLogStub, 3, {
      args: [
        "  - File path         :",
        Colors.green("./data_files/test1/dummy.txt"),
      ],
    });
    assertSpyCall(consoleLogStub, 4, {
      args: [
        "  - Catalog URL       :",
        Colors.green("https://www.example.com"),
      ],
    });
    assertSpyCall(consoleLogStub, 5, {
      args: [
        "  - Catalog resourceid:",
        Colors.green("dummycatalogresourceid"),
      ],
    });
    assertSpyCall(consoleLogStub, 6, {
      args: [
        "  - Last modified     :",
        Colors.green("2022-01-02T03:04:05.678Z"),
      ],
    });
    assertSpyCall(consoleLogStub, 7, {
      args: [
        "  - ETag              :",
        Colors.green("dummyetag"),
      ],
    });
    assertSpyCall(consoleLogStub, 8, {
      args: [
        "  - Last downloaded   :",
        Colors.green("2022-01-02T03:04:05.678Z"),
      ],
    });
    assertSpyCall(consoleLogStub, 9, {
      args: [
        "  - Integrity         :",
        Colors.green(""),
      ],
    });
    assertSpyCall(consoleLogStub, 10, {
      args: [
        "  - Post processes    :",
        Colors.green("encoding-utf-8"),
      ],
    });
    assertSpyCall(consoleLogStub, 11, {
      args: [
        "  - Headers           :",
        Colors.green("{}"),
      ],
    });
  });

  it("displays information on downloaded data without formatting.", async () => {
    createEmptyDimJson();
    const dimLockData: DimLockJSON = {
      lockFileVersion: "1.1",
      contents: [{
        catalogResourceId: null,
        catalogUrl: null,
        eTag: null,
        headers: {},
        integrity: "",
        lastDownloaded: new Date("2022-01-02T03:04:05.678Z"),
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
    await new ListAction().execute({ simple: true });

    assertSpyCall(consoleLogStub, 0, {
      args: [
        "test1",
        "https://example.com/dummy.txt",
        "./data_files/test1/dummy.txt",
        null,
        null,
        null,
        null,
        "2022-01-02T03:04:05.678Z",
        "",
        "encoding-utf-8",
        {},
      ],
    });
  });
});
