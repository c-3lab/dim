import { readXLSX, xlsx } from "../../deps.ts";
export class XLSXConverter {
  async convertToCSV(targetPath: string) {
    const workbook = await readXLSX(targetPath);
    const sheetData = workbook.Sheets[workbook.SheetNames[0]];
    const csv = xlsx.utils.sheet_to_csv(sheetData);
    Deno.writeTextFileSync(targetPath, csv);
  }
}
