import {
  assertEquals,
  assertMatch,
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
import { Colors } from "../../deps.ts";
import { InstallAction, ListAction, UpdateAction } from "../../libs/actions.ts";
import { DEFAULT_DIM_FILE_PATH, DIM_FILE_VERSION } from "../../libs/consts.ts";
import { DimJSON } from "../../libs/types.ts";
import {
  createKyGetStub,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";

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

  describe("with URL", () => {
    it('execute with the "name" listed in dim.json to check if the data has been updated.', async () => {
      createEmptyDimJson();
      await new UpdateAction().execute({}, "example");
    });
    it('exit with error when run with "name" not listed in dim.json', async () => {
      createEmptyDimJson();
      await new UpdateAction().execute({}, "example2");
    });
  });
  describe("", () => {
    it("execute without specifying any options or arguments, and check if the data in dim.json has been updated.", async () => {
      createEmptyDimJson();
      await new UpdateAction().execute({ asyncInstall: true }, undefined);
    });
    it("specify -A and check for asynchronous execution", async () => {
      createEmptyDimJson();
      await new UpdateAction().execute({}, undefined);
    });
  });
});
