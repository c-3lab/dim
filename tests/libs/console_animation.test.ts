import { assertSpyCall, Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { afterEach, beforeEach, describe, it } from "https://deno.land/std@0.152.0/testing/bdd.ts";
import { Colors } from "../../deps.ts";
import { ConsoleAnimation } from "../../libs/console_animation.ts";

describe("ConsoleAnimation", () => {
  let originalDirectory: string;
  let denoStdoutStub: Stub;

  beforeEach(() => {
    denoStdoutStub = stub(Deno.stdout, "write");
    originalDirectory = Deno.cwd();
  });

  afterEach(() => {
    denoStdoutStub.restore();
    Deno.chdir(originalDirectory);
  });
  it("Run the print method", () => {
    const consoleAnimation = new ConsoleAnimation(["1", "2"], "dummy");
    // First time
    consoleAnimation.print();
    assertSpyCall(denoStdoutStub, 0, {
      args: [new TextEncoder().encode(Colors.brightBlue("\r1"))],
    });
    assertSpyCall(denoStdoutStub, 1, {
      args: [new TextEncoder().encode(" dummy")],
    });
    // Second time
    consoleAnimation.print();
    assertSpyCall(denoStdoutStub, 2, {
      args: [new TextEncoder().encode(Colors.brightBlue("\r2"))],
    });
    assertSpyCall(denoStdoutStub, 3, {
      args: [new TextEncoder().encode(" dummy")],
    });
    // Third time
    consoleAnimation.print();
    assertSpyCall(denoStdoutStub, 4, {
      args: [new TextEncoder().encode(Colors.brightBlue("\r1"))],
    });
    assertSpyCall(denoStdoutStub, 5, {
      args: [new TextEncoder().encode(" dummy")],
    });
  });
});
