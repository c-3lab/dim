import { assert, assertEquals, assertFalse } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { returnsNext, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import { GenerateAction } from "../../libs/actions.ts";
import { createAxiosStub, createErrorAxiosStub, removeTemporaryFiles, temporaryDirectory } from "../helper.ts";
import { Confirm, Input } from "../../deps.ts";
import { DimLockJSON } from "../../libs/types.ts";
import { DEFAULT_DIM_LOCK_FILE_PATH } from "../../libs/consts.ts";

describe("GenerateAction", () => {
  let consoleLogStub: Stub;
  let consoleErrorStub: Stub;
  let denoExitStub: Stub;
  let denoStdoutStub: Stub;
  let fakeTime: FakeTime;
  let originalDirectory: string;

  beforeEach(() => {
    Deno.env.set("OPENAI_API_KEY", "xxxxxxx");
    consoleLogStub = stub(console, "log");
    consoleErrorStub = stub(console, "error");
    denoStdoutStub = stub(Deno.stdout, "write");
    denoExitStub = stub(Deno, "exit");
    fakeTime = new FakeTime("2022-01-02 03:04:05.678Z");
    originalDirectory = Deno.cwd();
    Deno.chdir(temporaryDirectory);
  });

  afterEach(() => {
    removeTemporaryFiles();
    fakeTime.restore();
    denoStdoutStub.restore();
    denoExitStub.restore();
    consoleErrorStub.restore();
    consoleLogStub.restore();
    Deno.chdir(originalDirectory);
    Deno.env.delete("OPENAI_API_KEY");
  });

  it("with options when target is file path", async () => {
    const axiosStub = createAxiosStub();
    const confirmStub = stub(
      Confirm,
      "prompt",
      () => Promise.resolve(true),
    );

    await new GenerateAction().execute(
      { target: "../test_data/valid_csv.csv", output: "example.py" },
      "python code that convert this csv data to geojson",
    );
    const code = Deno.readTextFileSync("example.py");
    const generatedCode = Deno.readTextFileSync("../test_data/generated_code.py");
    assertEquals(code, generatedCode);
    axiosStub.restore();
    confirmStub.restore();
  });
  it("with options when generated code is not hit", async () => {
    const axiosStub = createAxiosStub();
    const confirmStub = stub(
      Confirm,
      "prompt",
      () => Promise.resolve(false),
    );

    await new GenerateAction().execute(
      { target: "../test_data/valid_csv.csv", output: "example.py" },
      "python code that convert this csv data to geojson",
    );
    axiosStub.restore();
    confirmStub.restore();
  });
  it("with options when target is data name", async () => {
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
    const axiosStub = createAxiosStub();
    const confirmStub = stub(
      Confirm,
      "prompt",
      () => Promise.resolve(true),
    );

    await new GenerateAction().execute(
      { target: "test1", output: "example.py" },
      "python code that convert this csv data to geojson",
    );
    const code = Deno.readTextFileSync("example.py");
    const generatedCode = Deno.readTextFileSync("../test_data/generated_code.py");
    assertEquals(code, generatedCode);
    axiosStub.restore();
    confirmStub.restore();
  });
  it("with options when does not exist api key", async () => {
    Deno.env.delete("OPENAI_API_KEY");
    const axiosStub = createAxiosStub();
    const confirmStub = stub(
      Confirm,
      "prompt",
      () => Promise.resolve(true),
    );
    await new GenerateAction().execute(
      { target: "../test_data/valid_csv.csv", output: "example.py" },
      "python code that convert this csv data to geojson",
    );
    axiosStub.restore();
    confirmStub.restore();
  });
  it("with options when raise error axios", async () => {
    const errorAxiosStub = createErrorAxiosStub();
    const confirmStub = stub(
      Confirm,
      "prompt",
      () => Promise.resolve(true),
    );
    await new GenerateAction().execute(
      { target: "../test_data/valid_csv.csv", output: "example.py" },
      "python code that convert this csv data to geojson",
    );
    errorAxiosStub.restore();
    confirmStub.restore();
  });
  it("without options", async () => {
    const axiosStub = createAxiosStub();
    const inputStub = stub(
      Input,
      "prompt",
      returnsNext([
        Promise.resolve("../test_data/valid_csv.csv"),
        Promise.resolve("example.py"),
      ]),
    );
    const confirmStub = stub(
      Confirm,
      "prompt",
      () => Promise.resolve(true),
    );

    await new GenerateAction().execute(
      {},
      "python code that convert this csv data to geojson",
    );
    const code = Deno.readTextFileSync("example.py");
    const generatedCode = Deno.readTextFileSync("../test_data/generated_code.py");
    assertEquals(code, generatedCode);
    axiosStub.restore();
    inputStub.restore();
    confirmStub.restore();
  });
  it("without options when invalid input", async () => {
    const axiosStub = createAxiosStub();
    const inputStub = stub(
      Input,
      "prompt",
      returnsNext([
        Promise.resolve("../test_data/valid_csv.csv"),
        Promise.resolve("example.py"),
      ]),
    );
    const confirmStub = stub(
      Confirm,
      "prompt",
      () => Promise.resolve(true),
    );

    await new GenerateAction().execute(
      {},
      "python code that convert this csv data to geojson",
    );
    const [targetInputPromptMessage, _, __, targetInputPromptValidate] = Object.values(
      inputStub.calls[0].args[0],
    );
    assertEquals(
      targetInputPromptMessage,
      "Enter the target data name or file path to send to ChatGPT.",
    );
    assert(targetInputPromptValidate("test"));
    assertFalse(targetInputPromptValidate(""));

    const [outputInputPromptMessage, outputInputPromptValidate] = Object.values(
      inputStub.calls[1].args[0],
    );
    assertEquals(
      outputInputPromptMessage,
      "Enter a output file path.",
    );
    assert(outputInputPromptValidate("./test.py"));
    assertFalse(outputInputPromptValidate(""));
    axiosStub.restore();
    inputStub.restore();
    confirmStub.restore();
  });
});
