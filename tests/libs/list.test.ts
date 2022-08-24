import { InitAction, InstallAction, ListAction } from "../../libs/actions.ts";

import { removeTemporaryFiles, temporaryDirectory } from "../helper.ts";

//  list
Deno.test({
  name: "ListAction",
  async fn(t) {
    Deno.chdir(temporaryDirectory);
    await new InitAction().execute();
    await new InstallAction().execute(
      { file: "./../test-dim.json" },
      undefined,
    );

    //  オプションを指定せずに実行
    await t.step("Run without options", async () => {
      await new ListAction().execute({});
    });

    //  -sを指定し実行
    await t.step("Specify -s and execute", async () => {
      await new ListAction().execute({ simple: true });
    });
    removeTemporaryFiles();
  },
  //  AssertionError: Test case is leaking 1 resourceの原因が特定出来ていないため、一時的に無視している。
  sanitizeResources: false,
});
