import { Colors, readXLSX, xlsx } from "../../deps.ts";
import { BasePostprocess } from "./base_postprocess.ts";

export class XlsxToCsvConverter extends BasePostprocess {
  async execute(_: string[], targetPath: string): Promise<string> {
    const workbook = await readXLSX(targetPath);
    const sheetData = workbook.Sheets[workbook.SheetNames[0]];
    const csv = xlsx.utils.sheet_to_csv(sheetData);
    Deno.writeTextFileSync(targetPath.replace(/\.xlsx$/, ".csv"), csv);
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
