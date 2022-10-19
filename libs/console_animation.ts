import { Colors } from "../deps.ts";

export class ConsoleAnimation {
  private intervalId!: number;
  private index = 0;

  constructor(private animationPattern: string[], private message: string) {
  }
  print = () => {
    Deno.stdout.write(
      new TextEncoder().encode(
        Colors.brightBlue(
          `\r${this.animationPattern[this.index++]}`,
        ),
      ),
    );
    Deno.stdout.write(
      new TextEncoder().encode(
        ` ${this.message}`,
      ),
    );
    this.index %= this.animationPattern.length;
  };
  start(delay: number) {
    this.index = 0;
    this.intervalId = setInterval(this.print, delay);
  }
  stop() {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      console.log();
    }
  }
}
