import { download } from "../deps.ts";

const url =
  "https://raw.githubusercontent.com/denolib/high-res-deno-logo/master/deno_hr.png";
const fileName = "deno.png";
const dir = ".";

await download(url, { file: fileName, dir });