import { Colors, ky } from "../deps.ts";
import { OPENAPI_COMPLETIONS_ENDPOINT } from "./consts.ts";
import { OpenAICompletionsResponse } from "./types.ts";

export class ChatGPTClient {
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
        },
      ).json<OpenAICompletionsResponse>();
    } catch (error) {
      console.error(
        Colors.red(error.message),
        Colors.yellow(`\nThe problem may be improved by temporarily reducing the number of target data.`),
      );
      Deno.exit(1);
    }
    return response;
  }
}
