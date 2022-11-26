import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { assertSpyCall, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";

import { CleanAction } from "../../libs/actions.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import { DEFAULT_DIM_FILE_PATH, DEFAULT_DIM_LOCK_FILE_PATH } from "../../libs/consts.ts";
import { Colors } from "../../deps.ts";

describe("CleanAction", () => {
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

  it("Delete the data_files and initialize the project.", async () => {
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

    await new CleanAction().execute();

    const dataDirectory = Deno.statSync("data_files");
    assertEquals(dataDirectory.isDirectory, true);

    const dimJson = JSON.parse(
      Deno.readTextFileSync("dim.json"),
    );
    assertEquals(dimJson, { fileVersion: "1.1", contents: [] });

    const dimLockJson = JSON.parse(
      Deno.readTextFileSync("dim-lock.json"),
    );
    assertEquals(dimLockJson, { lockFileVersion: "1.1", contents: [] });
    assertSpyCall(consoleLogStub, 0, {
      args: [
        Colors.green("Successfully cleaned."),
      ],
    });
  });
  it("Failed to clean when does not exists the data_files directory.", async () => {
    await new CleanAction().execute();

    assertSpyCall(consoleLogStub, 0, {
      args: [
        Colors.red("Failed to delete ./data_files"),
      ],
    });
  });
});
