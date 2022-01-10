export interface Content {
  url: string;
  name: string;
  preprocesses: string[];
}
export interface LockContent {
  url: string;
  path: string;
  name: string;
  preprocesses: string[];
  lastUpdated: Date;
}

export interface DimJSON {
  fileVersion: number;
  contents: Content[];
}
export interface DimLockJSON {
  lockFileVersion: number;
  contents: LockContent[];
}
