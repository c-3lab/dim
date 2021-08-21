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
  contents: Content[];
}
export interface DimLockJSON {
  lockFileVersion: number;
  contents: LockContent[];
}
