import { Colors, Configuration, OpenAIApi } from "../deps.ts";

export class ChatGPTClient {
  private openai;

  constructor() {
    const apiKey = Deno.env.get("OPENAI_API_KEY")!;
    if (!apiKey) {
      console.log(
        Colors.red("Not set environment variable of 'OPENAI_API_KEY'\n"),
      );
      Deno.exit(1);
    }
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
  }
  async request(prompt: string) {
    try {
      const gptResponse = await this.openai.createCompletion({
        model: "text-davinci-003",
        prompt,
        max_tokens: 1024,
        temperature: 0,
      });
      return gptResponse;
    } catch (error) {
      console.log(
        Colors.red(`\n${error.response.data.error.message}`),
        Colors.yellow(`\nThe problem may be improved by temporarily reducing the number of target data.`),
      );
      Deno.exit(1);
    }
  }
}
