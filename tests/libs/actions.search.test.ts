import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import {
  assertSpyCall,
  assertSpyCalls,
  returnsNext,
  spy,
  Stub,
  stub,
} from "https://deno.land/std@0.152.0/testing/mock.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { FakeTime } from "https://deno.land/std@0.152.0/testing/time.ts";
import { SearchAction } from "../../libs/actions.ts";
import {
  createKyGetStub,
  removeTemporaryFiles,
  temporaryDirectory,
} from "../helper.ts";
import { encoding } from "./../../deps.ts";
import { Confirm, Input, Number } from "../../deps.ts";
import { Downloader } from "../../libs/downloader.ts";
import { DimFileAccessor, DimLockFileAccessor } from "../../libs/accessor.ts";
import { CkanApiClient } from "../../libs/ckan_api_client.ts";
import { Colors } from "../../deps.ts";
import { ENCODINGS } from "../../libs/consts.ts";
import { boolean } from "https://deno.land/x/cliffy@v0.24.2/flags/types/boolean.ts";

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

describe("SearchAction", () => {
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

  describe("with keyword", () => {
    it("check that the results are displayed on the standard output.", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));
      await new SearchAction().execute(
        { number: 10 },
        "避難所",
      );
      kyStub.restore();
    });

    it("check whether results are displayed in the standard output when multiple keywords are specified.", async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));
      await new SearchAction().execute(
        { number: 1 },
        "避難所 東京",
      );
      kyStub.restore();
    });

    // 保留
    // it("error in search process", async () => {
    //   const kyStub = stub(
    //     ky,
    //     "get",
    //     () => {
    //       throw new Error("error in search process");
    //     },
    //   );

    //   try {
    //     await new SearchAction().execute(
    //       { number: 1 },
    //       "避難所",
    //     );
    //   } finally {
    //     kyStub.restore();
    //   }

    //   assertSpyCall(consoleLogStub, 0, {
    //     args: [
    //       Colors.red("Failed to search."),
    //     ],
    //   });
    // });

    it("exit with error when display on stdout that results could not be obtained", async () => {
      const kyStub = createKyGetStub(
        JSON.stringify({ "result": { "results": [] } }),
      );
      await new SearchAction().execute(
        { number: 1 },
        "避難所 東京 神奈川",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
      kyStub.restore();
    });

    // Todo
    // it("without keyword", async () => {
    //   const cmd = "dim search".split(" ");
    //   const p = Deno.run({ cmd: cmd, stdout: "piped" });
    //   const o = await p.output();
    //   console.log(new TextDecoder().decode(o));
    //   assertEquals(
    //     new TextDecoder().decode(o),"");
    //   );
    //   p.close();
    // });
  });

  describe("with n option", () => {
    // it("specify 1 for the n option", async () => {
    //   await new SearchAction().execute(
    //     { number: 1 },
    //     "避難所",
    //   );
    // });

    // 保留
    // it("specify 100 for the n option", async () => {
    //   await new SearchAction().execute(
    //     { number: 100 },
    //     "避難所",
    //   );
    // });

    it('exit with error when if the value of "-n" is other than 1 to 100', async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));
      await new SearchAction().execute(
        { number: 0 },
        "避難所",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
      kyStub.restore();
    });

    it('exit with error when if the value of "-n" is other than 1 to 100', async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));
      await new SearchAction().execute(
        { number: -1 },
        "避難所",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
      kyStub.restore();
    });

    it('exit with error when if the value of "-n" is other than 1 to 100', async () => {
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));
      await new SearchAction().execute(
        { number: 101 },
        "避難所",
      );
      assertSpyCall(denoExitStub, 0, { args: [1] });
      kyStub.restore();
    });
  });

  describe("with i option", () => {
    it(
      "if no name is specified, it is automatically generated.",
      async () => {
        createEmptyDimJson();
        const numberStub = stub(
          Number,
          "prompt",
          () => {
            return Promise<number>.resolve(1);
          },
        );
        const inputStub = stub(
          Input,
          "prompt",
          () => {
            return Promise<string>.resolve("");
          },
        );
        const confirmStub = stub(
          Confirm,
          "prompt",
          () => {
            return Promise<boolean>.resolve(false);
          },
        );

        const data = Deno.readTextFileSync("../test_data/searchData.json");
        const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            headers: {},
            name: "xckan_title_name",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "xckan_title_name",
            path: "./data_files/xckan_title_name/dummy.csv",
            postProcesses: [],
            url: "https://example.com/dummy.csv",
          }],
        });

        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      },
    );

    it("ensure that the command to extract the downloaded files is entered and recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => {
          return Promise<number>.resolve(2);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => {
          return Promise<string>.resolve("unzip");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => {
          return Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "unzip",
          postProcesses: ["unzip"],
          url: "https://example.com/dummy.zip",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "unzip",
          path: "./data_files/unzip/dummy.zip",
          postProcesses: ["unzip"],
          url: "https://example.com/dummy.zip",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it("after downloading, convert the xlsx file to a csv file and check that it is recorded in dim.json and dim-lock.json.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(3);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("xlsx-to-csv");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "xlsx-to-csv",
          postProcesses: ["xlsx-to-csv"],
          url: "https://example.com/dummy.xlsx",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "xlsx-to-csv",
          path: "./data_files/xlsx-to-csv/dummy.xlsx",
          postProcesses: ["xlsx-to-csv"],
          url: "https://example.com/dummy.xlsx",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it('after downloading, encode the file to "euc-jp" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode euc-jp");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "encode euc-jp",
          postProcesses: ["encode euc-jp"],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "encode euc-jp",
          path: "./data_files/encode euc-jp/dummy.csv",
          postProcesses: ["encode euc-jp"],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it('after downloading, encode the file to "iso-2022-jp" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode iso-2022-jp");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "encode iso-2022-jp",
          postProcesses: ["encode iso-2022-jp"],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "encode iso-2022-jp",
          path: "./data_files/encode iso-2022-jp/dummy.csv",
          postProcesses: ["encode iso-2022-jp"],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it('after downloading, encode the file to "shift_jis" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode shift_jis");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "encode shift_jis",
          postProcesses: ["encode shift_jis"],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "encode shift_jis",
          path: "./data_files/encode shift_jis/dummy.csv",
          postProcesses: ["encode shift_jis"],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it('after downloading, encode the file to "utf-8" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode utf-8");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "encode utf-8",
          postProcesses: ["encode utf-8"],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "encode utf-8",
          path: "./data_files/encode utf-8/dummy.csv",
          postProcesses: ["encode utf-8"],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it('after downloading, encode the file to "utf-16" and check that it is recorded in dim.json, dim-lock.json', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode utf-16");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode utf-16",
            postProcesses: ["encode utf-16"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode utf-16",
            path: "./data_files/encode utf-16/dummy.csv",
            postProcesses: ["encode utf-16"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('exit with error when specify "encode utf-16be" in "postProcess", and download', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode utf-16be");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      try {
        await new SearchAction().execute(
          { number: 11, install: true },
          "避難所",
        );

        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode utf-16be",
            postProcesses: ["encode utf-16be"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode utf-16be",
            path: "./data_files/encode utf-16be/dummy.csv",
            postProcesses: ["encode utf-16be"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('exit with error when specify "encode utf-16le" in "postProcess", and download', async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode utf-16le");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );
        const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
        assertEquals(dimJson, {
          fileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            headers: {},
            name: "encode utf-16le",
            postProcesses: ["encode utf-16le"],
            url: "https://example.com/dummy.csv",
          }],
        });

        const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
        assertEquals(dimLockJson, {
          lockFileVersion: "1.1",
          contents: [{
            catalogResourceId: "resource_id",
            catalogUrl: "https://example.com",
            eTag: null,
            headers: {},
            integrity: "",
            lastDownloaded: "2022-01-02T03:04:05.678Z",
            lastModified: null,
            name: "encode utf-16le",
            path: "./data_files/encode utf-16le/dummy.csv",
            postProcesses: ["encode utf-16le"],
            url: "https://example.com/dummy.csv",
          }],
        });
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it('after downloading, encode the file to "encode unicode" and check that it is recorded in dim.json, dim-lock.json', async () => {
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("encode unicode");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    it(
      "ensure that the specified string and the path to the downloaded data are displayed on standard output and recorded in data_files, dim.json and dim-lock.json when the file is downloaded.",
      async () => {
        const numberStub = stub(
          Number,
          "prompt",
          async () => {
            return await Promise<number>.resolve(1);
          },
        );
        const inputStub = stub(
          Input,
          "prompt",
          async () => {
            return await Promise<string>.resolve("cmd echo hoge");
          },
        );
        const confirmStub = stub(
          Confirm,
          "prompt",
          async () => {
            return await Promise<boolean>.resolve(false);
          },
        );

        const data = Deno.readTextFileSync("../test_data/searchData.json");
        const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

        try {
          await new SearchAction().execute(
            { number: 10, install: true },
            "避難所",
          );
        } finally {
          numberStub.restore();
          inputStub.restore();
          confirmStub.restore();
          kyStub.restore();
        }
      },
    );

    it("exit with error when duplicate names.", async () => {
      await new DimFileAccessor().addContent(
        "http://example.com",
        "name duplication check",
        [],
        {},
      );
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("name duplication check");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );
      } catch (e) {
        assertEquals(
          e.message,
          "Test case attempted to exit with exit code: 1",
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        kyStub.restore();
      }
    });

    // Todo 以下のエラーが出る
    // error: AssertionError: Test case is leaking 1 resource:
    //  - A fetch response body (rid 46) was created during the test, but not consumed during the test. Consume or close the response body `ReadableStream`, e.g `await resp.text()` or `await resp.body.cancel()`.
    it("check whether to terminate in the event of a communication error", async () => {
      const numberStub = stub(
        Number,
        "prompt",
        async () => {
          return await Promise<number>.resolve(1);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        async () => {
          return await Promise<string>.resolve("");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        async () => {
          return await Promise<boolean>.resolve(false);
        },
      );
      const downloaderStub = stub(
        new Downloader(),
        "download",
        async (url: URL, name: string, headers?: Record<string, string>) => {
          throw new Error("Error in install process");
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      try {
        await new SearchAction().execute(
          { number: 10, install: true },
          "避難所",
        );
      } catch (e) {
        assertEquals(
          e.message,
          "Test case attempted to exit with exit code: 1",
        );
      } finally {
        numberStub.restore();
        inputStub.restore();
        confirmStub.restore();
        downloaderStub.restore();
        kyStub.restore();
      }
    });

    it("check whether a download was not performed when an invalid number was entered.", async () => {
      createEmptyDimJson();
      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));
      const jsonData = JSON.parse(data);

      let enteredNumber: number;
      const enteredNumbers = [0, -1, 101, 1];
      enteredNumbers.forEach((number) => {
        if (1 <= number <= jsonData.result.results.length) {
          enteredNumber = number;
        }
      });

      const numberStub = stub(
        Number,
        "prompt",
        () => {
          return Promise<number>.resolve(enteredNumber);
        },
      );
      const inputStub = stub(
        Input,
        "prompt",
        () => {
          return Promise<string>.resolve("");
        },
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => {
          return Promise<boolean>.resolve(false);
        },
      );

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "xckan_title_name",
          postProcesses: [],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "xckan_title_name",
          path: "./data_files/xckan_title_name/dummy.csv",
          postProcesses: [],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it("Check whether a download was not performed when invalid characters were entered.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => {
          return Promise<number>.resolve(1);
        },
      );
      const enteredNames = ["!?", "success value"];
      const successValue = enteredNames.filter((text) => {
        if (/^[\w\-０-９ぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠\s]*$/.test(text)) {
          return text;
        }
      })[0];
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise<string>.resolve(successValue),
          Promise<string>.resolve(""),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        () => {
          return Promise<boolean>.resolve(false);
        },
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "success value",
          postProcesses: [],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "success value",
          path: "./data_files/success value/dummy.csv",
          postProcesses: [],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it("Check whether a download did not take place when an invalid post-process was entered.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => {
          return Promise<number>.resolve(1);
        },
      );
      const encodingPostProcesses = ENCODINGS.map((encoding) =>
        `encode ${encoding.toLowerCase()}`
      );
      const availablePostProcesses = [
        "unzip",
        "xlsx-to-csv",
        ...encodingPostProcesses,
      ];
      const enteredPostProcesses = ["hoge", "cmd echo hoge", "encode utf-8"];
      const successValues = enteredPostProcesses.filter((text) => {
        if (
          text === "" || text.startsWith("cmd ") ||
          availablePostProcesses.includes(text)
        ) {
          return text;
        }
      });
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise<string>.resolve("name"),
          Promise<string>.resolve(successValues[0]),
          Promise<string>.resolve(successValues[1]),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        returnsNext([
          Promise<boolean>.resolve(true),
          Promise<boolean>.resolve(false),
        ]),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "name",
          postProcesses: ["cmd echo hoge", "encode utf-8"],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "name",
          path: "./data_files/name/dummy.csv",
          postProcesses: ["cmd echo hoge", "encode utf-8"],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });

    it("Ensure that no post-processing has taken place if a blank is entered for post-processing.", async () => {
      createEmptyDimJson();
      const numberStub = stub(
        Number,
        "prompt",
        () => {
          return Promise<number>.resolve(1);
        },
      );
      const encodingPostProcesses = ENCODINGS.map((encoding) =>
        `encode ${encoding.toLowerCase()}`
      );
      const availablePostProcesses = [
        "unzip",
        "xlsx-to-csv",
        ...encodingPostProcesses,
      ];
      let enteredPostProcesses = "";
      let successValue = "";
      if (
        enteredPostProcesses === "" ||
        enteredPostProcesses.startsWith("cmd ") ||
        availablePostProcesses.includes(enteredPostProcesses)
      ) {
        successValue = enteredPostProcesses;
      }
      const inputStub = stub(
        Input,
        "prompt",
        returnsNext([
          Promise<string>.resolve("name"),
          Promise<string>.resolve(successValue),
        ]),
      );
      const confirmStub = stub(
        Confirm,
        "prompt",
        returnsNext([
          Promise<boolean>.resolve(false),
        ]),
      );

      const data = Deno.readTextFileSync("../test_data/searchData.json");
      const kyStub = createKyGetStub(data.replace(/[\n\s]/g, ""));

      await new SearchAction().execute(
        { number: 10, install: true },
        "避難所",
      );

      const dimJson = JSON.parse(Deno.readTextFileSync("dim.json"));
      assertEquals(dimJson, {
        fileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          headers: {},
          name: "name",
          postProcesses: [],
          url: "https://example.com/dummy.csv",
        }],
      });

      const dimLockJson = JSON.parse(Deno.readTextFileSync("dim-lock.json"));
      assertEquals(dimLockJson, {
        lockFileVersion: "1.1",
        contents: [{
          catalogResourceId: "resource_id",
          catalogUrl: "https://example.com",
          eTag: null,
          headers: {},
          integrity: "",
          lastDownloaded: "2022-01-02T03:04:05.678Z",
          lastModified: null,
          name: "name",
          path: "./data_files/name/dummy.csv",
          postProcesses: [],
          url: "https://example.com/dummy.csv",
        }],
      });

      numberStub.restore();
      inputStub.restore();
      confirmStub.restore();
      kyStub.restore();
    });
  });
});
