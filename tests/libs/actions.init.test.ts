import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
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

  it("ensure that empty data directories, dim.json and dim-lock.json are created.", async () => {
    await new InitAction().execute();

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
