import { Colors } from "../../deps.ts";
import { Catalog } from "../types.ts";

export const showSearchResult = (catalogs: Catalog[]) => {
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
};

export const showSearchResultJson = (catalogs: Catalog[]) => {
  console.log(catalogs);
};
