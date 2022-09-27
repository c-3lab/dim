import { Colors, decompress } from "../../deps.ts";
import { BasePostprocess } from "./base_postprocess.ts";
import DenoWrapper from "../deno_wrapper.ts";

export class Unzipper extends BasePostprocess {
  async execute(_: string[], targetPath: string): Promise<string> {
    const splitedPath = targetPath.split("/");
    const targetDir = splitedPath.slice(0, splitedPath.length - 1).join("/");
    if (DenoWrapper.build.os === "darwin") {
      const process = Deno.run({
        cmd: ["ditto", "-xk", "--sequesterRsrc", targetPath, targetDir],
        stdout: "piped",
        stderr: "piped",
      });
      const rawOutput = await process.output();
      Deno.stdout.write(rawOutput);
    } else {
      await decompress(targetPath, targetDir);
    }
    return targetDir;
  }
  validate(argumentList: string[]) {
    if (argumentList.length > 0) {
      console.log(
        Colors.red("error: Too many arguments:"),
        Colors.red(this.type + " " + argumentList.join(" ")),
      );
      this.printUsage();
      return false;
    }
    return true;
  }
}
