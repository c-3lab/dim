import { Colors, encoding } from "./../../deps.ts";
import { BasePostprocess } from "./base_postprocess.ts";

export class Encoder extends BasePostprocess {
  async execute(argumentList: string[], targetPath: string): Promise<string> {
    const byteArray = Deno.readFileSync(targetPath);
    const encodedByteArray = encoding.default.convert(byteArray, {
      to: argumentList[0],
      from: "AUTO",
    });
    await Deno.writeFile(
      targetPath,
      Uint8Array.from(encodedByteArray),
    );
    return targetPath;
  }
  validate(argumentList: string[]) {
    if (argumentList.length === 0) {
      console.log(
        Colors.red("Argument not specified."),
      );
      this.printUsage();
      return false;
    } else if (argumentList.length > 1) {
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
