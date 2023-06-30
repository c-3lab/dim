import { Colors, Confirm, DOMParser, Input, ky, Number, Sha1 } from "../../deps.ts";
import { DEFAULT_DIM_LOCK_FILE_PATH, ENCODINGS } from "../consts.ts";
import { Downloader } from "../downloader.ts";
import { ConsoleAnimation } from "../console_animation.ts";
import { DimFileAccessor, DimLockFileAccessor } from "../accessor.ts";
import { Catalog, CatalogResource, Content, DimJSON, LockContent } from "../types.ts";
import { PostprocessDispatcher } from "../postprocess/postprocess_dispatcher.ts";
import { createDataFilesDir, initDimLockFile } from "./initializer.ts";

export const installFromURL = async (
  url: string,
  name: string,
  postProcesses: string[] | undefined,
  headers: Record<string, string> = {},
  catalogUrl: string | null = null,
  catalogResourceId: string | null = null,
) => {
  await createDataFilesDir();
  try {
    Deno.statSync(DEFAULT_DIM_LOCK_FILE_PATH);
  } catch {
    await initDimLockFile();
  }

  const result = await new Downloader().download(new URL(url), name, headers);
  if (postProcesses !== undefined) {
    await executePostprocess(postProcesses, result.fullPath);
  }
  const lockContent: LockContent = {
    name,
    url,
    path: result.fullPath,
    catalogUrl,
    catalogResourceId,
    lastModified: null,
    eTag: null,
    lastDownloaded: new Date(),
    integrity: getIntegrity(result.fullPath),
    postProcesses: postProcesses || [],
    headers,
  };
  const responseHeaders = result.response.headers;
  lockContent.eTag = responseHeaders.get("etag")?.replace(/^"(.*)"$/, "$1") ??
    null;
  if (responseHeaders.has("last-modified")) {
    lockContent.lastModified = new Date(responseHeaders.get("last-modified")!);
  }
  const content: Content = {
    url,
    name,
    catalogUrl,
    catalogResourceId,
    postProcesses: postProcesses || [],
    headers,
  };
  await new DimFileAccessor().addContent(content);
  await new DimLockFileAccessor().addContent(lockContent);

  return result.fullPath;
};

const getInstallList = (contents: Content[]) => {
  const installList = contents.map((content) => {
    return function () {
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
            catalogUrl: content.catalogUrl,
            catalogResourceId: content.catalogResourceId,
            lastModified: lastModified,
            eTag: headers.get("etag")?.replace(/^"(.*)"$/, "$1") ?? null,
            lastDownloaded: new Date(),
            integrity: getIntegrity(fullPath),
            postProcesses: content.postProcesses,
            headers: content.headers,
          });
        });
      });
    };
  });
  return installList;
};

export const installFromDimFile = async (
  path: string,
  asyncInstall = false,
  isUpdate = false,
) => {
  await createDataFilesDir();
  try {
    Deno.statSync(DEFAULT_DIM_LOCK_FILE_PATH);
  } catch {
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
      dimLockFileAccessor.getContents().every((lockContent) => lockContent.name !== content.name);
    contents = contents.filter(isNotInstalled);
  }
  let lockContentList: LockContent[] = [];
  const installList = getInstallList(contents);

  if (!asyncInstall) {
    for (const install of installList) {
      const lockContent = await install().catch((error) => {
        console.error(
          Colors.red("Failed to process."),
          Colors.red(error.message),
        );
        Deno.exit(1);
      });
      lockContentList.push(lockContent);
    }
  } else {
    lockContentList = await Promise.all(
      installList.map((install) => install()),
    ).catch((error) => {
      console.error(
        Colors.red("Failed to process."),
        Colors.red(error.message),
      );
      Deno.exit(1);
    });
  }

  const contentList: Content[] = [];
  if (lockContentList !== undefined) {
    for (const lockContent of lockContentList.filter((c) => c !== undefined)) {
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

const postprocessDispatcher = new PostprocessDispatcher();

const executePostprocess = async (
  postProcesses: string[],
  targetPath: string,
) => {
  for (const postProcess of postProcesses) {
    const [type, ...argumentList] = postProcess.split(" ");
    await postprocessDispatcher.dispatch(type, argumentList, targetPath);
  }
};

const getIntegrity = function (
  targetPath: string,
): string {
  const byteArray = Deno.readFileSync(targetPath);
  return new Sha1().update(byteArray).toString();
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

export const interactiveInstall = async (catalogs: Catalog[]): Promise<string> => {
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
    message: "Enter the number of data to install",
    min: 1,
    max: catalogResources.length,
  });

  const enteredName = await Input.prompt({
    message: "Enter the name. Enter blank if want to use CKAN resource name.",
    validate: (text) => /^[\w\-０-９ぁ-んァ-ヶｱ-ﾝﾞﾟ一-龠\s]*$/.test(text),
  });

  const postProcesses: string[] = [];
  const encodingPostProcesses = ENCODINGS.map((encoding) => `encode ${encoding.toLowerCase()}`);
  const availablePostProcesses = [
    "unzip",
    "xlsx-to-csv",
    "csv-to-json",
    ...encodingPostProcesses,
  ];

  while (true) {
    const enteredPostProcess = await Input.prompt({
      message: "Enter the post-processing you want to add. Enter blank if not required.",
      hint: "(ex.: > unzip, xlsx-to-csv, csv-to-json, encode utf-8 or cmd [some cli command])",
      validate: (text) => {
        return text === "" || text.startsWith("cmd ") ||
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

  const targetContent = new DimFileAccessor().getContents().find((c) => c.name === name);
  if (targetContent !== undefined) {
    console.log("The name already exists.");
    Deno.exit(1);
  }
  const catalogResource = catalogResources[enteredNumber - 1];
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

export const installFromPage = async (
  pageInstallUrl: string,
  expression: string | undefined,
  postProcesses: string[] | undefined,
  headers: Record<string, string> = {},
  name?: string,
) => {
  const getResult = await fetch(pageInstallUrl);
  if (!getResult.ok) throw new Error("Fetch response error");
  const html = await getResult.text();
  const document = new DOMParser().parseFromString(html, "text/html");
  if (document === null) {
    console.log(Colors.red("Can't read html."));
    Deno.exit(1);
  }
  const linklist = document.getElementsByTagName("a");
  let idx = 0;
  for (const link of linklist) {
    const re = new RegExp(expression as string, "g");
    let href = new URL(
      link.getAttribute("href") as string,
      pageInstallUrl,
    ).toString();
    if (re.test(href)) {
      idx += 1;
      const dataName = `${name}_${idx}`;
      const fullPath = await installFromURL(
        href,
        dataName,
        postProcesses,
        headers,
      ).catch((error) => {
        console.log(Colors.red("Failed to pageInstall"));
        console.log(Colors.red("target:" + href));
        console.log(Colors.red(error.message));
      });
      console.log(Colors.green(`Installed to ${fullPath}`));
    }
  }
  return idx;
};
