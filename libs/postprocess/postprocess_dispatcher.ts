import { Colors } from "../../deps.ts";
import { Command } from "./command.ts";
import { Encoder } from "./encoder.ts";
import { Unzipper } from "./unzipper.ts";
import { XlsxToCsvConverter } from "./xlsx_to_csv_converter.ts";
import { CsvToJsonConverter } from "./csv_to_json_converter.ts";

export class PostprocessDispatcher {
  private encoder;
  private unzipper;
  private xlsxToCsvConverter;
  private csvToJsonConverter;
  private command;
  constructor() {
    this.encoder = new Encoder("encode", ["encoding-to"]);
    this.unzipper = new Unzipper("unzip", []);
    this.xlsxToCsvConverter = new XlsxToCsvConverter("xlsx-to-csv", []);
    this.csvToJsonConverter = new CsvToJsonConverter("csv-to-json", []);
    this.command = new Command("cmd", ["script"]);
  }
  async dispatch(type: string, argumentList: string[], targetPath: string) {
    if (type === this.encoder.type) {
      if (this.encoder.validate(argumentList)) {
        const encodingTo = argumentList[0].toUpperCase();
        await this.encoder.execute([encodingTo], targetPath);
        console.log("Converted encoding to", encodingTo);
      } else {
        Deno.exit(1);
      }
    } else if (type === this.unzipper.type) {
      if (this.unzipper.validate(argumentList)) {
        const targetDir = await this.unzipper.execute([], targetPath);
        console.log(`Unzip the file to ${targetDir}`);
      } else {
        Deno.exit(1);
      }
    } else if (type === this.xlsxToCsvConverter.type) {
      if (this.xlsxToCsvConverter.validate(argumentList)) {
        await this.xlsxToCsvConverter.execute([], targetPath);
        console.log(`Convert xlsx to csv.`);
      } else {
        Deno.exit(1);
      }
    } else if (type === this.csvToJsonConverter.type) {
      if (this.csvToJsonConverter.validate(argumentList)) {
        await this.csvToJsonConverter.execute([], targetPath);
        console.log('Convert csv to json.');
      } else {
        Deno.exit(1);
      }
    } else if (type === this.command.type) {
      const script = argumentList.join(" ");
      try {
        if (this.command.validate(argumentList)) {
          console.log("Execute Command: ", argumentList, targetPath);
          const result = await this.command.execute([script], targetPath);
          console.log(result);
        }
      } catch (e) {
        console.log(
          Colors.red(`Failed to execute the "${script}"\n`),
          Colors.red(`${e}`),
        );
        // Do not `exit` because there are commands that do not correspond when obtained from external dim.json.
      }
    } else {
      console.log(`No support a postprocess '${type}' '${argumentList}'.`);
    }
  }
}
