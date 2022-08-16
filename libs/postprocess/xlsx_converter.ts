import { readXLSX, xlsx } from "../../deps.ts";
export class XLSXConverter {
  async convertToCSV(targetPath: string) {
    const workbook = await readXLSX(targetPath);
    const sheetData = workbook.Sheets[workbook.SheetNames[0]];
    const csv = xlsx.utils.sheet_to_csv(sheetData);
    const splitPath = targetPath.split("/");
    const dir = splitPath.slice(0, -1).join("/");
    const fileName = splitPath[splitPath.length - 1].replace(
      /\..xlsx$/,
      ".csv",
    );
    const filePath = dir + "/" + fileName;
    Deno.writeTextFileSync(filePath, csv);
  }
}
