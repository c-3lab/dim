import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.152.0/testing/bdd.ts";

import { InitAction } from "../../libs/actions.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

describe("InitAction", () => {
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

  it("create empty data directory, dim.json and dim-lock.json", async () => {
    //  InitActionを実行
    await new InitAction().execute();

    //  data_files, dim.json, dim-lock.jsonを確認
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
  });
});
