import { assertSpyCall, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { Colors } from "../../deps.ts";
import { VerifyAction } from "../../libs/actions.ts";
import DenoWrapper from "../../libs/deno_wrapper.ts";
import {
  createKyGetStub,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";

describe("VerifyAction", () => {
  let consoleLogStub: Stub;
  let consoleErrorStub: Stub;
  let denoExitStub: Stub;
  let denoStdoutStub: Stub;
  let fakeTime: FakeTime;
  let originalDirectory: string;
  let originalOS: "darwin" | "linux" | "windows";

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    consoleErrorStub = stub(console, "error");
    denoExitStub = stub(Deno, "exit");
    denoStdoutStub = stub(Deno.stdout, "write");
    fakeTime = new FakeTime("2022-01-02T03:04:05.678Z");
    originalDirectory = Deno.cwd();
    //      originalOS = DenoWrapper.build.os;
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    fakeTime.restore();
    denoStdoutStub.restore();
    denoExitStub.restore();
    consoleErrorStub.restore();
    consoleLogStub.restore();
    DenoWrapper.build.os = originalOS;
    Deno.chdir(originalDirectory);
  });

  it("download from locally existing all data installed dim.json and check that it is recorded in dim.json and dim-lock.json.", async () => {
    const kyGetStub = createKyGetStub("dummy");
    try {
      Deno.copyFileSync(
        "../test_data/installed-dim-lock.json",
        "dim-lock.json",
      );
      await new VerifyAction().execute();
      assertSpyCall(consoleLogStub, 0, {
        args: [
          Colors.green(`verification success`),
        ],
      });
    } finally {
      kyGetStub.restore();
    }
  });
});
