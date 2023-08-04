import { Colors, ky } from "../deps.ts";
import { OPENAPI_COMPLETIONS_ENDPOINT } from "./consts.ts";
import { OpenAICompletionsResponse, OpenAIErrorResponse } from "./types.ts";
import * as mod from "https://deno.land/x/oak@v10.6.0/httpError.ts";

export class OpenAIClient {
  private apiKey;

  constructor() {
    this.apiKey = Deno.env.get("OPENAI_API_KEY")!;
    if (!this.apiKey) {
      console.log(
        Colors.red("Not set environment variable of 'OPENAI_API_KEY'\n"),
      );
      Deno.exit(1);
    }
  }
  async request(prompt: string) {
    let response;
    try {
      response = await ky.post(
        OPENAPI_COMPLETIONS_ENDPOINT,
        {
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` },
          json: {
            model: "text-davinci-003",
            prompt,
            max_tokens: 1024,
            temperature: 0,
          },
          timeout: false,
        },
      ).json<OpenAICompletionsResponse>();
    } catch (error) {
      if (error instanceof ky.HTTPError ) {
        const errorJson = await error.response.json<OpenAIErrorResponse>();
        console.error(
          '\nerror message by ky client:',
          Colors.red(`\n${error.message}`),
        );
        console.error(
          '\nerror response by openai:\n', JSON.stringify(errorJson,null,2)
        );  
      }
      Deno.exit(1);
    }
    return response;
  }
}
