import { Colors, ky } from "../deps.ts";
import { DEFAULT_SEARCH_ENDPOINT } from "./consts.ts";
import { CkanApiResponse } from "./types.ts";

export class CkanApiClient {
  async search(keywords: string[], number: number): Promise<CkanApiResponse> {
    let searchWord: string;
    if (keywords.length === 1) {
      searchWord = `*${keywords[0]}*`;
    } else {
      searchWord = "(" + keywords.map((keyword) => `*${keyword}*`).join(" AND ") +
        ")";
    }

    const searchParams = new URLSearchParams(
      {
        fq: `xckan_title:${searchWord} OR tags:${searchWord} OR x_ckan_description:${searchWord}`,
        rows: number.toString(),
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
    return response;
  }
}
