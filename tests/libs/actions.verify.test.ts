import { assertSpyCall, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { Colors } from "../../deps.ts";
import { VerifyAction } from "../../libs/actions.ts";
import DenoWrapper from "../../libs/deno_wrapper.ts";
import { createKyGetStub, removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

describe("VerifyAction", () => {
  let consoleLogStub: Stub;
  let originalDirectory: string;
  let originalOS: "darwin" | "linux" | "windows";

  beforeEach(() => {
    consoleLogStub = stub(console, "log");
    originalDirectory = Deno.cwd();
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    consoleLogStub.restore();
    DenoWrapper.build.os = originalOS;
    Deno.chdir(originalDirectory);
  });

  it("run verify command with no change.", async () => {
    const kyGetStub = createKyGetStub("dummy");
    try {
      Deno.copyFileSync(
        "../test_data/installed-dim-lock.json",
        "dim-lock.json",
      );
      await new VerifyAction().execute();
      assertSpyCall(consoleLogStub, 0, {
        args: [
          Colors.green("latest"),
        ],
      });
    } finally {
      kyGetStub.restore();
    }
  });

  it("run verify command with data updated.", async () => {
    const kyGetStub = createKyGetStub("updated", {
      headers: {
        "integrity": "testintegrity",
      },
    });
    try {
      Deno.copyFileSync(
        "../test_data/installed-dim-lock.json",
        "dim-lock.json",
      );
      await new VerifyAction().execute();
      assertSpyCall(consoleLogStub, 0, {
        args: [
          Colors.red("outdated"),
        ],
      });
    } finally {
      kyGetStub.restore();
    }
  });
});
