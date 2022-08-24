Deno.test({
  name: "help",
  async fn() {
    const p = Deno.run({
      cmd: ["dim", "help"],
      stdout: "piped",
    });
    console.log(new TextDecoder().decode(await p.output()));
    p.close();
  },
});
