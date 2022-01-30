export class Command {
  async execute(script: string, path: string) {
    const cmd = script.split(" ");
    cmd.push(path);
    const p = Deno.run({
      cmd: cmd,
      stdout: "piped",
    });
    const o = await p.output();
    return new TextDecoder().decode(o);
  }
}
