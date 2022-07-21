import { decompress } from "../../deps.ts";

export class Unzipper {
  async unzip(targetPath: string) {
    const splitedPath = targetPath.split("/");
    const targetDir = splitedPath.slice(0, splitedPath.length - 1).join("/");
    if (Deno.build.os === "darwin") {
      const process = Deno.run({
        cmd: ["ditto", "-xk", "--sequesterRsrc", targetPath, targetDir],
        stdout: "piped",
        stderr: "piped",
      });
      const rawOutput = await process.output();
      Deno.stdout.write(rawOutput);
    } else {
      await decompress(targetPath);
    }
    return targetDir;
  }
}
