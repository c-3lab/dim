import { Command } from "./deps.ts";
interface Action {
}

class InitAction implements Action {
  execute(options: any): void {
    console.log(options);
  }
}

class InstallAction implements Action {
  execute(options: any, url: string): void {
    console.log(options, url);
  }
}

class UninstallAction implements Action {
  execute(options: any, name: string): void {
    console.log(options, name);
  }
}
class UpdateAction implements Action {
  execute(options: any, name: string): void {
    console.log(options, name);
  }
}
const NAME = "dim";
const VERSION = "0.1";

const { options, args } = await new Command()
  .name(NAME)
  .version(VERSION)
  .command(
    "init",
    new Command()
      .description("Init the project")
      .action(new InitAction().execute),
  )
  .command(
    "install <url:string>",
    new Command()
      .description("Install the data")
      .help("Specify the url of data")
      .action(new InstallAction().execute),
  )
  .command(
    "uninstall <name:string>",
    new Command()
      .description("Uninstall the data")
      .help("Specify the data name or data url")
      .action(new UninstallAction().execute),
  )
  .command(
    "update <name:string>",
    new Command()
      .description("Uninstall the data")
      .action(new UninstallAction().execute),
  )
  .parse(Deno.args);
