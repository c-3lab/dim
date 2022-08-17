import { encoding } from "./../../../deps.ts";
import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";
import { Encoder } from "../../../libs/postprocess/encoder.ts";
import { removeTemporaryFiles, temporaryDirectory } from "../../helper.ts";

Deno.test("Encoder#encodefile will call encoding.default.convert with specified encoding", async () => {
  Deno.chdir(temporaryDirectory);
  //  SJIS形式のデータを用意
  const utf8Bytes = new TextEncoder().encode("テストデータ");
  const sjisBytesArray = encoding.convert(utf8Bytes, {
    from: "UTF8",
    to: "SJIS",
  });
  Deno.writeFileSync("test.txt", Uint8Array.from(sjisBytesArray));

  //  encoderの処理を呼び出す
  const encoder = new Encoder();
  await encoder.encodeFile("test.txt", "UTF-8");

  //  ファイルがUTF-8形式に変換されていることを確認する
  const encodedText = Deno.readTextFileSync("test.txt");
  assertEquals(encodedText, "テストデータ");

  //  テスト用ファイルの削除
  removeTemporaryFiles();
});
