export interface Content {
  name: string;
  url: string;
  catalogUrl: string;
  catalogResourceId: string;
  postProcesses: string[];
  headers: { [key: string]: string };
}
export interface LockContent {
  name: string;
  url: string;
  path: string;
  catalogUrl: string;
  catalogResourceId: string;
  lastModified: string;
  eTag: string;
  lastDonwloaded: Date;
  integrity: string;
  postProcesses: string[];
  headers: { [key: string]: string };
}

export interface DimJSON {
  fileVersion: number;
  contents: Content[];
}
export interface DimLockJSON {
  lockFileVersion: number;
  contents: LockContent[];
}
