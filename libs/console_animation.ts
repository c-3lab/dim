export class ConsoleAnimation {
  private intervalId!: number;
  constructor(private animationPattern: string[], private message: string) {}
  async start(delay: number) {
    let index = 0;
    await new Promise<number>(() => {
      this.intervalId = setInterval(() => {
        Deno.stdout.write(
          new TextEncoder().encode(
            `\r${this.animationPattern[index++]} ${this.message}`,
          ),
        );
        index %= this.animationPattern.length;
      }, delay);
    });
  }
  stop() {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      console.log();
    }
  }
}
