import { decompress } from "../deps.ts";
export default class DenoWrapper {
  static build = {
    os: Deno.build.os,
  };
  static zip = {
    decompress: decompress,
  };
}
