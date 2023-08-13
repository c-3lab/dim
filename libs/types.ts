import { KyResponse } from "../deps.ts";

export interface Content {
  name: string;
  url: string;
  catalogUrl: string | null;
  catalogResourceId: string | null;
  postProcesses: string[];
  headers: { [key: string]: string };
}
export interface LockContent {
  name: string;
  url: string;
  path: string;
  catalogUrl: string | null;
  catalogResourceId: string | null;
  lastModified: Date | null;
  eTag: string | null;
  lastDownloaded: Date;
  integrity: string;
  postProcesses: string[];
  headers: { [key: string]: string };
}

export interface DimJSON {
  fileVersion: string;
  contents: Content[];
}
export interface DimLockJSON {
  lockFileVersion: string;
  contents: LockContent[];
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  description: string;
  created: string;
  format: string;
}

export interface Catalog {
  xckan_title: string;
  xckan_site_url: string;
  xckan_description: string;
  license_title: string;
  resources: Resource[];
}

export interface CkanApiResponse {
  result: {
    results: Catalog[];
  };
}
export interface DownlodedResult {
  fullPath: string;
  response: KyResponse;
}

export interface CatalogResource {
  catalogTitle: string;
  catalogUrl: string;
  id: string;
  name: string;
  url: string;
}

export interface OpenAICompletionsResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: [{
    text: string;
    index: number;
    logprobs?: number | null;
    finish_reason: string;
  }];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIErrorResponse {
  error: {
    message: string;
    type: string;
    param: string | null;
    code: string;
  };
}
