import {
  Command,
  CompletionsCommand,
  DenoLandProvider,
  HelpCommand,
  UpgradeCommand,
} from "./deps.ts";
import {
  InitAction,
  InstallAction,
  ListAction,
  UninstallAction,
  UpdateAction,
} from "./libs/actions.ts";
import { NAME, VERSION } from "./libs/consts.ts";

await new Command()
  .name(NAME)
  .version(VERSION)
  .default("help")
  .command(
    "init",
    new Command()
      .description("Init the project.")
      .action(new InitAction().execute),
  )
  .command(
    "install [url:string]",
    new Command()
      .description("Install the data.")
      .help(
        "Specify the url of data. If you dont't specify argument, install all data which is not installed dependency.",
      )
      .action(new InstallAction().execute),
  )
  .command(
    "uninstall <name:string>",
    new Command()
      .description("Uninstall the data.")
      .help("Specify the data name or data url.")
      .action(new UninstallAction().execute),
  )
  .command(
    "list",
    new Command()
      .description("Show the data list.")
      .action(new ListAction().execute),
  )
  .command(
    "update [name:string]",
    new Command()
      .description("Update the data.")
      .action(new UpdateAction().execute),
  )
  .command(
    "upgrade",
    new UpgradeCommand({
      provider: [new DenoLandProvider({ name: "dim" })],
    }),
  )
  .command("help", new HelpCommand())
  .command("complete", new CompletionsCommand())
  .parse(Deno.args);
