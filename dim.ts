import {
  Command,
  CompletionsCommand,
  DenoLandProvider,
  GithubProvider,
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
    "install",
    new Command()
      .arguments("[url:string]")
      .option(
        "-p, --preprocess <preprocess>",
        "Specify pre-processing when installing.",
        { collect: true },
      )
      .option(
        "-n, --name <name:string>",
        "Specify the name.",
      )
      .description(
        "Install the data.\n" +
          "Specify the url of data. If you dont't specify argument, install all data which is not installed dependency.",
      )
      .action(new InstallAction().execute),
  )
  .command(
    "uninstall",
    new Command()
      .arguments("<url:string>")
      .description(
        "Uninstall the data.\n" +
          "Specify the data name or data url.",
      )
      .action(new UninstallAction().execute),
  )
  .command(
    "list",
    new Command()
      .option(
        "-s, --simple",
        "Simple format.",
      )
      .description("Show the data list.")
      .action(new ListAction().execute),
  )
  .command(
    "update",
    new Command()
      .arguments("[url:string]")
      .option(
        "-p, --preprocess <preprocess>",
        "Specify pre-processing when installing.",
        { collect: true },
      )
      .description("Update the data.")
      .action(new UpdateAction().execute),
  )
  .command(
    "upgrade",
    new UpgradeCommand({
      provider: [
        new GithubProvider({ repository: "c-3lab/dim" }),
      ],
    }),
  )
  .command("help", new HelpCommand())
  .command("complete", new CompletionsCommand())
  .parse(Deno.args);
