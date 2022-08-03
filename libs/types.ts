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
  lastDonwloaded: Date;
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
