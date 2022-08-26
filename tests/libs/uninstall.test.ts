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
import { UninstallAction } from "../../libs/actions.ts";
import {
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
} from "../../libs/consts.ts";
import { DimJSON, DimLockJSON } from "../../libs/types.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

function fileExists(filePath: string): boolean {
  try {
    Deno.statSync(filePath);
    return true;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

describe("UninstallAction", () => {
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

  it("delete downloaded data and rewrite dim.json, dim-lock.json", async () => {
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
      DEFAULT_DIM_LOCK_FILE_PATH,
      JSON.stringify(dimLockData, null, 2),
    );
    await Deno.writeTextFile(
      DEFAULT_DIM_FILE_PATH,
      JSON.stringify(dimData, null, 2),
    );
    Deno.mkdirSync("data_files/test1", { recursive: true });
    Deno.writeTextFileSync("./data_files/test1/dummy.txt", "dummy");
    let _: void;
    await new UninstallAction().execute(_, "test1");

    assertEquals(fileExists("./data_files/test1/dummy.txt"), false);
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
      DEFAULT_DIM_LOCK_FILE_PATH,
      JSON.stringify(dimLockData, null, 2),
    );
    await Deno.writeTextFile(
      DEFAULT_DIM_FILE_PATH,
      JSON.stringify(dimData, null, 2),
    );
    let _: void;
    await new UninstallAction().execute(_, "example");

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
