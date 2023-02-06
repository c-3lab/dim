import { Stub, stub } from "https://deno.land/std@0.152.0/testing/mock.ts";
import { resolve } from "https://deno.land/std@0.152.0/path/mod.ts";
import { ky } from "../deps.ts";
import axios, { AxiosResponse } from "npm:axios@0.26";

const currentDirectory = new URL(".", import.meta.url).pathname;
export const temporaryDirectory = resolve(currentDirectory, "temporary") + "/";
Deno.mkdirSync(temporaryDirectory, { recursive: true });

export const createKyGetStub = (
  body: BodyInit,
  options?: ResponseInit,
): Stub => {
  const mockedKy = ky.extend({
    hooks: {
      beforeRequest: [
        (_request) => {
          return new Response(body, options);
        },
      ],
    },
  });

  return stub(ky, "get", mockedKy.get);
};
export const createAxiosStub = () => {
  const generatedCode = Deno.readTextFileSync("../test_data/generated_code.py");
  const response: AxiosResponse = {
    data: { id: "", object: "", created: 0, model: "", choices: [{ text: generatedCode }] },
    status: 200,
    statusText: "",
    headers: {},
    config: {},
  };
  return stub(axios.default, "request", () => Promise.resolve(response));
};

export const createErrorAxiosStub = () => {
  const generatedCode = Deno.readTextFileSync("../test_data/generated_code.py");
  const response: AxiosResponse = {
    data: { id: "", object: "", created: 0, model: "", choices: [{ text: generatedCode }] },
    status: 200,
    statusText: "",
    headers: {},
    config: {},
  };
  return stub(axios.default, "request", () => Promise.reject(response));
};

export const removeTemporaryFiles = () => {
  for (const path of Deno.readDirSync(temporaryDirectory)) {
    Deno.removeSync(temporaryDirectory + path.name, { recursive: true });
  }
};

export function fileExists(filePath: string): boolean {
  try {
    Deno.statSync(filePath);
    return true;
  } catch {
    return false;
  }
}

export const createEmptyDimJson = () => {
  Deno.writeTextFileSync(
    "dim.json",
    JSON.stringify({ fileVersion: "1.1", contents: [] }),
  );
  Deno.writeTextFileSync(
    "dim-lock.json",
    JSON.stringify({ lockfileVersion: "1.1", contents: [] }),
  );
};
