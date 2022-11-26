import { Colors } from "../deps.ts";
import { DEFAULT_DIM_FILE_PATH, DEFAULT_DATAFILES_PATH } from "./consts.ts";
import { DimFileAccessor, DimLockFileAccessor } from "./accessor.ts";
import { CkanApiClient } from "./ckan_api_client.ts";
import { createDataFilesDir, initDimFile, initDimLockFile } from "./action_helper/initializer.ts";
import { installFromDimFile, installFromURL, interactiveInstall, parseHeader } from "./action_helper/installer.ts";

export class InitAction {
  async execute() {
    await createDataFilesDir();
    await initDimFile();
    await initDimLockFile();
    console.log(Colors.green("Initialized the project for the dim."));
  }
}

export class InstallAction {
  async execute(
    options: {
      postProcesses?: string[];
      name?: string;
      headers?: string[];
      file?: string;
      force?: boolean;
      asyncInstall?: boolean;
    },
    url: string | undefined,
  ) {
    if (url && options.file) {
      console.log(
        Colors.red("Cannot use -f option and URL at the same time."),
      );
      Deno.exit(1);
    }

    const parsedHeaders: Record<string, string> = parseHeader(options.headers);
    if (url !== undefined) {
      if (options.name === undefined) {
        console.log(Colors.red("The -n option is not specified."));
        Deno.exit(1);
      }
      const targetContent = new DimFileAccessor().getContents().find((c) => c.name === options.name);
      if (targetContent !== undefined && !options.force) {
        console.log(Colors.red("The name already exists."));
        console.log(
          Colors.red(
            "Use the -F option to force installation and overwrite existing files.",
          ),
        );
        Deno.exit(1);
      }
      const fullPath = await installFromURL(
        url,
        options.name,
        options.postProcesses,
        parsedHeaders,
      ).catch(
        (error) => {
          console.error(
            Colors.red("Failed to install."),
            Colors.red(error.message),
          );
          Deno.exit(1);
        },
      );
      console.log(
        Colors.green(`Installed to ${fullPath}`),
      );
    } else {
      const lockContentList = await installFromDimFile(
        options.file || DEFAULT_DIM_FILE_PATH,
        options.asyncInstall,
        options.force,
      ).catch(() => {
        console.log(Colors.red("Selecting other than json."));
        Deno.exit(1);
      });

      if (lockContentList !== undefined) {
        if (lockContentList.length != 0) {
          console.log(
            Colors.green(`Successfully installed.`),
          );
        } else {
          console.log("All contents have already been installed.");
          console.log(
            "Use the -F option to force installation and overwrite existing files.",
          );
        }
      }
    }
  }
}

export class UninstallAction {
  async execute(_: void, name: string) {
    const isRemovedDimFile = await new DimFileAccessor().removeContent(name);
    if (isRemovedDimFile) {
      console.log(
        Colors.green("Removed a content from the dim.json."),
      );
    } else {
      console.log(
        Colors.red("Failed to remove. Not Found a content in the dim.json."),
      );
    }
    const dimLockFileAccessor = new DimLockFileAccessor();
    const targetContent = dimLockFileAccessor.getContents().find((c) => c.name === name);
    const isRemovedDimLockFile = await dimLockFileAccessor.removeContent(name);
    if (isRemovedDimLockFile) {
      console.log(
        Colors.green("Removed a content from the dim-lock.json."),
      );
    } else {
      console.log(
        Colors.red(
          "Failed to remove. Not Found a content in the dim-lock.json.",
        ),
      );
    }
    if (targetContent !== undefined) {
      try {
        Deno.statSync(targetContent.path);
        await Deno.remove(targetContent.path);
        console.log(
          Colors.green(`Removed a file '${targetContent.path}'.`),
        );
      } catch {
        console.log(
          Colors.red(`Failed to remove a file '${targetContent.path}'.`),
        );
      }
      // TODO: Remove an empty direcotory
    }
  }
}

export class CleanAction {
  async execute() {
    try {
      // Clean
      await Deno.removeSync(DEFAULT_DATAFILES_PATH, { recursive: true });
      console.log(Colors.green("Successfully cleaned."));
      console.log("Deleted ./data_files");

      // Initialize
      await createDataFilesDir();
      await initDimFile();
      await initDimLockFile();
      console.log(Colors.green("Initialized the project for the dim."));

    } catch (error) {
      console.log(Colors.red("Failed to delete ./data_files"));
      console.log(error);
    }
  }
}


export class ListAction {
  execute(
    options: { simple?: boolean },
  ): void {
    const contents = new DimLockFileAccessor().getContents();
    contents.forEach((content) => {
      if (options.simple == true) {
        console.log(
          content.name,
          content.url,
          content.path,
          content.catalogUrl,
          content.catalogResourceId,
          content.lastModified,
          content.eTag,
          content.lastDownloaded,
          content.integrity,
          content.postProcesses.join(","),
          content.headers,
        );
      } else {
        console.log(
          content.name,
        );
        console.log(
          "  - URL               :",
          Colors.green(content.url),
        );
        console.log(
          "  - Name              :",
          Colors.green(content.name),
        );
        console.log(
          "  - File path         :",
          Colors.green(content.path),
        );
        console.log(
          "  - Catalog URL       :",
          Colors.green(
            content.catalogUrl === null ? "null" : content.catalogUrl,
          ),
        );
        console.log(
          "  - Catalog resourceid:",
          Colors.green(
            content.catalogResourceId === null ? "null" : content.catalogResourceId,
          ),
        );
        console.log(
          "  - Last modified     :",
          Colors.green(
            content.lastModified === null ? "null" : content.lastModified.toString(),
          ),
        );
        console.log(
          "  - ETag              :",
          Colors.green(content.eTag === null ? "null" : content.eTag),
        );
        console.log(
          "  - Last downloaded   :",
          Colors.green(content.lastDownloaded.toString()),
        );
        console.log(
          "  - Integrity         :",
          Colors.green(content.integrity),
        );
        console.log(
          "  - Post processes    :",
          Colors.green(content.postProcesses.join(", ")),
        );
        console.log(
          "  - Headers           :",
          Colors.green(JSON.stringify(content.headers)),
        );
        console.log();
      }
    });
  }
}

export class UpdateAction {
  async execute(
    options: { postProcesses?: string[]; asyncInstall?: boolean },
    name: string | undefined,
  ) {
    if (name !== undefined) {
      const content = new DimLockFileAccessor().getContents().find((c) => c.name === name);
      if (content === undefined) {
        console.error(
          Colors.red(
            "Faild to update. Not Found a content in the dim-lock.json. ",
          ),
        );
        Deno.exit(1);
      }
      const fullPath = await installFromURL(
        content.url,
        name,
        content.postProcesses,
        content.headers,
      ).catch(
        (error) => {
          console.error(
            Colors.red("Failed to update."),
            Colors.red(error.message),
          );
          Deno.exit(1);
        },
      );
      if (fullPath !== undefined) {
        console.log(
          Colors.green(`Updated ${name}.`),
          `\nFile path:`,
          Colors.yellow(fullPath),
        );
      }
    } else {
      await installFromDimFile(
        DEFAULT_DIM_FILE_PATH,
        options.asyncInstall,
        true,
      );
      console.log(
        Colors.green(`Successfully Updated.`),
      );
    }
  }
}

export class SearchAction {
  async execute(
    options: { number: number; install?: boolean },
    keyword: string,
  ) {
    if (options.number <= 0 || options.number > 100) {
      console.error(
        Colors.red("Failed to search."),
        Colors.red("Please enter a number between 1 and 100"),
      );
      Deno.exit(1);
    }

    const keywords = keyword.trim().split(/\s+/);
    const response = await new CkanApiClient().search(keywords, options.number);

    if (response.result.results.length === 0) {
      console.error(
        Colors.red("There were no results matching your keywords."),
        Colors.red("Please change the keyword and search again."),
      );
      Deno.exit(1);
    }

    const catalogs = response.result.results;

    let i = 1;
    for (const catalog of catalogs) {
      console.log(catalog.xckan_title);
      console.log(
        "  - Catalog URL        :",
        Colors.green(catalog.xckan_site_url),
      );
      console.log(
        "  - Catalog Description:",
        Colors.green(
          catalog.xckan_description == null ? "" : catalog.xckan_description.replace(/\r(?!\n)/g, "\n"),
        ),
      );
      console.log(
        "  - Catalog License    :",
        Colors.green(
          catalog.license_title == null ? "" : catalog.license_title,
        ),
      );
      for (const resource of catalog.resources) {
        console.log(`    ${i}.`, resource.name);
        console.log(
          "      * Resource URL        :",
          Colors.green(resource.url == null ? "" : resource.url),
        );
        console.log(
          "      * Resource Description:",
          Colors.green(
            resource.description == null ? "" : resource.description.replace(/\r(?!\n)/g, "\n"),
          ),
        );
        console.log(
          "      * Created             :",
          Colors.green(resource.created == null ? "" : resource.created),
        );
        console.log(
          "      * Format              :",
          Colors.green(resource.format == null ? "" : resource.format),
        );
        i++;
      }
      console.log();
    }

    if (!options.install) {
      return;
    }

    const fullPath = await interactiveInstall(catalogs);

    console.log(
      Colors.green(`Installed to ${fullPath}`),
    );
  }
}
