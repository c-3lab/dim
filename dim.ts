import { Command, CompletionsCommand, GithubProvider, HelpCommand, UpgradeCommand } from "./deps.ts";
import {
  CleanAction,
  GenerateAction,
  InitAction,
  InstallAction,
  ListAction,
  SearchAction,
  UninstallAction,
  UpdateAction,
  VerifyAction,
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
      .option(
        "-A, --asyncInstall",
        "Execute asyncronous install.",
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
    "clean",
    new Command()
      .description(
        "Delete only data_files and init the project.",
      )
      .action(new CleanAction().execute),
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
        "-A, --asyncInstall",
        "Execute asyncronous install.",
      )
      .description("Update the data.")
      .action(new UpdateAction().execute),
  )
  .command(
    "upgrade",
    new UpgradeCommand({
      main: "dim.ts",
      args: [
        "--allow-run",
        "--allow-read",
        "--allow-net",
        "--allow-write",
        "--unstable",
      ],
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
  .command(
    "verify",
    new Command()
      .description(
        "Verify the data.\n",
      )
      .action(new VerifyAction().execute),
  )
  .command(
    "generate",
    new Command()
      .option(
        "-t, --target <target:string>",
        "Specify the target data name or file path to send to GPT-3 API.",
      )
      .option(
        "-o, --output <output:string>",
        "Specify to output file path of generated post-process.",
      )
      .arguments("<prompt:string>")
      .description(
        "Auto-generate code about target data using GPT-3 API. \nFor example, conversion processing, visualization processing, etc.",
      )
      .action(new GenerateAction().execute),
  )
  .command("help", new HelpCommand())
  .command("complete", new CompletionsCommand())
  .parse(Deno.args);
