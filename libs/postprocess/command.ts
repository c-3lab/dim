import { Colors } from "../../deps.ts";
import { BasePostprocess } from "./base_postprocess.ts";

export class Command extends BasePostprocess {
  async execute(argumentList: string[], targetPath: string): Promise<string> {
    const cmd = argumentList[0].split(" ");
    cmd.push(targetPath);
    const p = Deno.run({
      cmd: cmd,
      stdout: "piped",
    });
    const o = await p.output();
    p.close();
    return new TextDecoder().decode(o);
  }
  validate(argumentList: string[]) {
    if (argumentList.length < 1) {
      console.log(
        Colors.red("No command entered"),
      );
      this.printUsage();
      return false;
    }
    return true;
  }
}
