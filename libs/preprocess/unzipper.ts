import { decompress } from "../../deps.ts";

export class Unzipper {
  unzip(targetPath: string) {
    const splitedPath = targetPath.split("/");
    const targetDir = splitedPath.slice(0, splitedPath.length - 1).join("/");
    if (Deno.build.os === "darwin") {
      const process = Deno.run({
        cmd: ["ditto", "-xk", "--sequesterRsrc", targetPath, targetDir],
        stdout: "piped",
        stderr: "piped",
      });
      process.output().then((rawOutput) => {
        Deno.stdout.write(rawOutput);
        console.log(`Unzip ${targetPath} to ${targetDir}`);
      });
    } else {
      decompress(targetPath).then(() => {
        console.log(`Unzip ${targetPath} to ${targetDir}`);
      });
    }
  }
}
