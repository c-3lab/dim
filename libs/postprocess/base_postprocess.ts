export abstract class BasePostprocess {
  type: string;
  argumentNameList: string[];
  constructor(type: string, argumentNameList: string[]) {
    this.type = type;
    this.argumentNameList = argumentNameList;
  }
  abstract execute(argumentList: string[], targetPath: string): Promise<string>;
  abstract validate(argumentList: string[]): boolean;
  printUsage() {
    console.log(
      "usage: " + this.type + " " +
        this.argumentNameList.map((arg) => `[${arg}]`).join(" "),
    );
  }
}
