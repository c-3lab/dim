import { parse } from "https://deno.land/std@0.174.0/encoding/csv.ts";
import { Colors } from "../../deps.ts";
import { BasePostprocess } from "./base_postprocess.ts";

export class CsvToJsonConverter extends BasePostprocess {
  async execute(_: string[], targetPath: string): Promise<string> {
    const text = await Deno.readTextFile(targetPath);
    const result = await parse(text, { skipFirstRow: true });
    await Deno.writeTextFileSync(targetPath.replace(/\.csv?$/, ".json"), JSON.stringify(result));
    return targetPath;
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
