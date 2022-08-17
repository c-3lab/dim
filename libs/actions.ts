import {
  Colors,
  Confirm,
  ensureDir,
  ensureFile,
  existsSync,
  Input,
  ky,
  Number,
} from "../deps.ts";
import {
  DEFAULT_DATAFILES_PATH,
  DEFAULT_DIM_FILE_PATH,
  DEFAULT_DIM_LOCK_FILE_PATH,
  DEFAULT_SEARCH_ENDPOINT,
  DIM_FILE_VERSION,
  DIM_LOCK_FILE_VERSION,
  ENCODINGS,
} from "./consts.ts";
import { Downloader } from "./downloader.ts";
import { ConsoleAnimation } from "./console_animation.ts";
import { DimFileAccessor, DimLockFileAccessor } from "./accessor.ts";
import {
  CatalogResource,
  CkanApiResponse,
  Content,
  DimJSON,
  DimLockJSON,
  LockContent,
} from "./types.ts";
import { Encoder } from "./postprocess/encoder.ts";
import { Unzipper } from "./postprocess/unzipper.ts";
import { XLSXConverter } from "./postprocess/xlsx_converter.ts";
import { Command } from "./postprocess/command.ts";

const initDimFile = async () => {
  const dimData: DimJSON = { fileVersion: DIM_FILE_VERSION, contents: [] };
  await ensureFile(DEFAULT_DIM_FILE_PATH);
  return await Deno.writeTextFile(
    DEFAULT_DIM_FILE_PATH,
    JSON.stringify(dimData, null, 2),
  );
};

const initDimLockFile = async () => {
  const dimLockData: DimLockJSON = {
    lockFileVersion: DIM_LOCK_FILE_VERSION,
    contents: [],
  };
  await ensureFile(DEFAULT_DIM_LOCK_FILE_PATH);
  return await Deno.writeTextFile(
    DEFAULT_DIM_LOCK_FILE_PATH,
    JSON.stringify(dimLockData, null, 2),
  );
};

const createDataFilesDir = async () => {
  await ensureDir(DEFAULT_DATAFILES_PATH);
};

const installFromURL = async (
  url: string,
  name: string,
  postProcesses: string[] | undefined,
  headers: Record<string, string> = {},
  catalogUrl: string | null = null,
  catalogResourceId: string | null = null,
) => {
  await createDataFilesDir();
  if (!existsSync(DEFAULT_DIM_LOCK_FILE_PATH)) {
    await initDimLockFile();
  }

  const result = await new Downloader().download(new URL(url), name, headers);
  if (postProcesses !== undefined) {
    await executePostprocess(postProcesses, result.fullPath);
  }
  const lockContent: LockContent = {
    name: name,
    url: url,
    path: result.fullPath,
    catalogUrl: catalogUrl,
    catalogResourceId: catalogResourceId,
    lastModified: null,
    eTag: null,
    lastDownloaded: new Date(),
    integrity: "",
    postProcesses: postProcesses || [],
    headers: headers,
  };
  const responseHeaders = result.response.headers;
  lockContent.eTag = responseHeaders.get("etag");
  if (responseHeaders.has("last-modified")) {
    lockContent.lastModified = new Date(responseHeaders.get("last-modified")!);
  }
  await new DimFileAccessor().addContent(
    url,
    name,
    postProcesses || [],
    headers,
    catalogUrl,
    catalogResourceId,
  );
  await new DimLockFileAccessor().addContent(lockContent);

  return result.fullPath;
};

const installFromDimFile = async (
  path: string,
  asyncDownload = false,
  isUpdate = false,
) => {
  await createDataFilesDir();
  if (!existsSync(DEFAULT_DIM_LOCK_FILE_PATH)) {
    await initDimLockFile();
  }

  let contents;
  if (path.match(/^https?:\/\//)) {
    const dimJson: DimJSON = await ky.get(
      path,
    ).json<DimJSON>();
    contents = dimJson.contents;
  } else {
    contents = new DimFileAccessor(path).getContents();
  }

  if (contents.length == 0) {
    console.log("No contents.\nYou should run a 'dim install <data url>'. ");
    return;
  }
  const dimLockFileAccessor = new DimLockFileAccessor();
  if (!isUpdate) {
    const isNotInstalled = (content: Content) =>
      dimLockFileAccessor.getContents().every((lockContent) =>
        lockContent.name !== content.name
      );
    contents = contents.filter(isNotInstalled);
  }
  const downloadList = contents.map((content) => {
    return new Promise<LockContent>((resolve) => {
      const consoleAnimation = new ConsoleAnimation(
        ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
        `Installing ${content.url} ...`,
      );
      consoleAnimation.start(100);
      new Downloader().download(
        new URL(content.url),
        content.name,
        content.headers,
      ).then(async (result) => {
        const fullPath = result.fullPath;
        const response = result.response;
        consoleAnimation.stop();
        await executePostprocess(content.postProcesses, fullPath);

        const headers = response.headers;
        let lastModified: Date | null = null;
        if (headers.has("last-modified")) {
          lastModified = new Date(headers.get("last-modified")!);
        }
        console.log(
          Colors.green(`Installed to ${fullPath}`),
        );
        console.log();

        resolve({
          name: content.name,
          url: content.url,
          path: fullPath,
          catalogUrl: null,
          catalogResourceId: null,
          lastModified: lastModified,
          eTag: headers.get("etag"),
          lastDownloaded: new Date(),
          integrity: "",
          postProcesses: content.postProcesses,
          headers: content.headers,
        });
      });
    });
  });
  let lockContentList: LockContent[] = [];

  if (!asyncDownload) {
    for (const donwloadPromsie of downloadList) {
      const lockContent = await donwloadPromsie.catch((error) => {
        console.error(
          Colors.red("Failed to process."),
          Colors.red(error.message),
        );
        Deno.exit(1);
      });
      lockContentList.push(lockContent);
    }
  } else {
    lockContentList = await Promise.all(downloadList).catch((error) => {
      console.error(
        Colors.red("Failed to process."),
        Colors.red(error.message),
      );
      Deno.exit(1);
    });
  }

  const contentList: Content[] = [];
  if (lockContentList !== undefined) {
    for (const lockContent of lockContentList) {
      contentList.push(
        {
          name: lockContent.name,
          url: lockContent.url,
          catalogUrl: lockContent.catalogUrl,
          catalogResourceId: lockContent.catalogResourceId,
          postProcesses: lockContent.postProcesses,
          headers: lockContent.headers,
        },
      );
    }
    await new DimLockFileAccessor().addContents(lockContentList);
    await new DimFileAccessor().addContents(contentList);
  }

  return lockContentList;
};

const installFromCatalog = async (
  catalogResource: CatalogResource,
  name: string,
  postProcesses: string[],
) => {
  const fullPath = await installFromURL(
    catalogResource.url,
    name,
    postProcesses,
    {},
    catalogResource.catalogUrl,
    catalogResource.id,
  ).catch(
    (error) => {
      console.error(
        Colors.red("Failed to install."),
        Colors.red(error.message),
      );
      Deno.exit(1);
    },
  );

  return fullPath;
};

const executePostprocess = async (
  postProcesses: string[],
  targetPath: string,
) => {
  for (const postProcess of postProcesses) {
    const [type, ...argumentList] = postProcess.split(" ");
    if (type === "encode") {
      if (argumentList.length === 0) {
        console.log(
          Colors.red("Argument not specified."),
        );
        Deno.exit(1);
      } else if (argumentList.length > 1) {
        console.log(
          Colors.red("error: Too many arguments:"),
          Colors.red(type + " " + argumentList.join(" ")),
        );
        Deno.exit(1);
      }
      const encodingTo = argumentList[0].toUpperCase();
      await new Encoder().encodeFile(targetPath, encodingTo);
      console.log("Converted encoding to", encodingTo);
    } else if (type === "unzip") {
      if (argumentList.length > 0) {
        console.log(
          Colors.red("error: Too many arguments:"),
          Colors.red(type + " " + argumentList.join(" ")),
        );
        Deno.exit(1);
      }
      const targetDir = await new Unzipper().unzip(targetPath);
      console.log(`Unzip the file to ${targetDir}`);
    } else if (type === "xlsx-to-csv") {
      if (argumentList.length > 0) {
        console.log(
          Colors.red("error: Too many arguments:"),
          Colors.red(type + " " + argumentList.join(" ")),
        );
        Deno.exit(1);
      }
      await new XLSXConverter().convertToCSV(targetPath);
      console.log(`Convert xlsx to csv.`);
    } else if (postProcess.startsWith("CMD:")) {
      const script = postProcess.replace("CMD:", "");
      if (script === "") {
        console.log(
          Colors.red("No command entered"),
        );
        Deno.exit(1);
      }
      await new Command().execute(script.trim(), targetPath);
      console.log("Execute Command: ", script, targetPath);
    } else {
      console.log(`No support a postprocess '${postProcess}'.`);
    }
  }
};

export const parseHeader = function (
  headers: string[] | undefined,
): Record<string, string> {
  const parsedHeaders: Record<string, string> = {};
  if (headers !== undefined) {
    for (const header of headers) {
      const [key, value] = header.split(/:\s*/);
      parsedHeaders[key] = value;
    }
  }
  return parsedHeaders;
};

export class InitAction {
  async execute(options: any) {
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
      asyncDownload?: boolean;
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
      const targetContent = new DimFileAccessor().getContents().find((c) =>
        c.name === options.name
      );
      if (targetContent !== undefined && !options.force) {
        console.log("The name already exists.");
        console.log(
          "Use the -F option to force installation and overwrite existing files.",
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
        options.asyncDownload,
        options.force,
      );
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
  async execute(options: any, name: string) {
    const isRemovedDimFile = await new DimFileAccessor().removeContent(name);
    if (isRemovedDimFile) {
      console.log(
        Colors.green("Removed a content from the dim.json."),
      );
    } else {
      console.log(
        Colors.red("Faild to remove. Not Found a content in the dim.json."),
      );
    }
    const dimLockFileAccessor = new DimLockFileAccessor();
    const targetContent = dimLockFileAccessor.getContents().find((c) =>
      c.name === name
    );
    const isRemovedDimLockFile = await dimLockFileAccessor.removeContent(name);
    if (isRemovedDimLockFile) {
      console.log(
        Colors.green("Removed a content from the dim-lock.json."),
      );
    } else {
      console.log(
        Colors.red(
          "Faild to remove. Not Found a content in the dim-lock.json.",
        ),
      );
    }
    if (targetContent !== undefined) {
      if (existsSync(targetContent.path)) {
        await Deno.remove(targetContent.path);
        console.log(
          Colors.green(`Removed a file '${targetContent.path}'.`),
        );
      }
      // TODO: Remove an empty direcotory
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
            content.catalogResourceId === null
              ? "null"
              : content.catalogResourceId,
          ),
        );
        console.log(
          "  - Last modified     :",
          Colors.green(
            content.lastModified === null
              ? "null"
              : content.lastDownloaded.toString(),
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
    options: { postProcesses?: string[]; asyncDownload?: boolean },
    name: string | undefined,
  ) {
    if (name !== undefined) {
      const content = new DimLockFileAccessor().getContents().find((c) =>
        c.name === name
      );
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
        options.postProcesses,
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
      console.log(
        Colors.green(`Updated ${name}.`),
        `\nFile path:`,
        Colors.yellow(fullPath),
      );
    } else {
      await installFromDimFile(
        DEFAULT_DIM_FILE_PATH,
        options.asyncDownload,
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
    let searchWord: string;
    if (keywords.length === 1) {
      searchWord = `*${keywords[0]}*`;
    } else {
      searchWord = "(" + keywords.map((keyword) =>
        `*${keyword}*`
      ).join(" AND ") + ")";
    }

    const searchParams = new URLSearchParams(
      {
        fq:
          `xckan_title:${searchWord} OR tags:${searchWord} OR x_ckan_description:${searchWord}`,
        rows: options.number.toString(),
      },
    );

    let response: CkanApiResponse;
    try {
      response = await ky.get(
        DEFAULT_SEARCH_ENDPOINT,
        { searchParams },
      ).json<CkanApiResponse>();
    } catch (error) {
      console.error(
        Colors.red("Failed to search."),
        Colors.red(error.message),
      );
      Deno.exit(1);
    }

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
          catalog.xckan_description == null
            ? ""
            : catalog.xckan_description.replace(/\r(?!\n)/g, "\n"),
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
            resource.description == null
              ? ""
              : resource.description.replace(/\r(?!\n)/g, "\n"),
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

    const catalogResources: CatalogResource[] = [];
    for (const catalog of catalogs) {
      for (const resource of catalog.resources) {
        catalogResources.push(
          {
            catalogTitle: catalog.xckan_title,
            catalogUrl: catalog.xckan_site_url,
            id: resource.id,
            name: resource.name,
            url: resource.url,
          },
        );
      }
    }

    const enteredNumber = await Number.prompt({
      message: "Enter the number of the data to install",
      min: 1,
      max: catalogResources.length,
    });

    const enteredName = await Input.prompt({
      message: "Enter the name. Enter blank if want to use CKAN resource name.",
      validate: (text) => /^[\w\-０-９ぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠\s]*$/.test(text),
    });

    const postProcesses: string[] = [];
    const encodingPostProcesses = ENCODINGS.map((encoding) =>
      `encode ${encoding.toLowerCase()}`
    );
    const availablePostProcesses = [
      "unzip",
      "xlsx-to-csv",
      ...encodingPostProcesses,
    ];

    while (true) {
      const enteredPostProcess = await Input.prompt({
        message:
          "Enter the post-processing you want to add. Enter blank if not required.",
        hint:
          "(ex.: > unzip, xlsx-to-csv, encode utf-8 or CMD:[some cli command])",
        validate: (text) => {
          return text === "" || text.startsWith("CMD:") ||
            availablePostProcesses.includes(text);
        },
        suggestions: availablePostProcesses,
      });

      if (enteredPostProcess === "") {
        break;
      }
      postProcesses.push(enteredPostProcess);

      const addNext = await Confirm.prompt({
        message: "Is there a post-processing you would like to add next?",
        default: true,
      });
      if (!addNext) {
        break;
      }
    }

    const name = enteredName === ""
      ? catalogResources[enteredNumber - 1].catalogTitle + "_" +
        catalogResources[enteredNumber - 1].name
      : enteredName;

    const targetContent = new DimFileAccessor().getContents().find((c) =>
      c.name === name
    );
    if (targetContent !== undefined) {
      console.log("The name already exists.");
      Deno.exit(1);
    }

    const fullPath = await installFromCatalog(
      catalogResources[enteredNumber - 1],
      name,
      postProcesses,
    );

    console.log(
      Colors.green(`Installed to ${fullPath}`),
    );
  }
}
