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
  SearchAction,
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
        "-p, --postProcesses <postProcesses>",
        "Specify post-processing when installing.",
        { collect: true },
      )
      .option(
        "-n, --name <name:string>",
        "Specify the name.This is required.",
      )
      .option(
        "-H, --headers <headers:string>",
        "Specify the header. Can specify multiple times.",
        { collect: true },
      )
      .option(
        "-f, --file <file:string>",
        "Specify the dim.json file when installing data.",
      )
      .option(
        "-F, --force",
        "Forced install. Overwrite already exist data file.",
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
      .arguments("<name:string>")
      .description(
        "Uninstall the data.\n" +
          "Specify the data name.",
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
      .arguments("[name:string]")
      .option(
        "-p, --postProcesses <postProcesses>",
        "Specify post-processing when installing.",
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
  .command(
    "search",
    new Command()
      .option(
        "-n, --number <number:integer>",
        "Specify the number of data to get by option -n (default 10).",
        {
          default: 10,
        },
      )
      .option(
        "-i, --install",
        "Interactive installation.",
      )
      .arguments("<keyword:string>")
      .description("Search data from package_search CKAN API")
      .action(new SearchAction().execute),
  )
  .command("help", new HelpCommand())
  .command("complete", new CompletionsCommand())
  .parse(Deno.args);
