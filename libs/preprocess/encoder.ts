import { encoding } from "./../../deps.ts";
export class Encoder {
  async encodeFile(filePath: string, to: string, from = "AUTO") {
    const byteArray = Deno.readFileSync(filePath);
    const encodedByteArray = encoding.default.convert(byteArray, {
      to,
      from,
    });
    await Deno.writeFile(
      filePath,
      Uint8Array.from(encodedByteArray),
    );
  }
}
