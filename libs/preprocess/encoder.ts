import { encoding } from "./../../deps.ts";
export class Encoder {
  encodeFile(filePath: string, to: string, from = "AUTO") {
    const byteArray = Deno.readFileSync(filePath);
    const encodedByteArray = encoding.default.convert(byteArray, {
      to,
      from,
    });
    Deno.writeFileSync(
      filePath,
      Uint8Array.from(encodedByteArray),
    );
    console.log("Converted encoding to", to);
  }
}
