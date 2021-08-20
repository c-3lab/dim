interface DimJSON {
  data: [{ url: string; name: string; preprocess: [string] | [] }] | [];
}
interface DimLockJSON {
  lockFileVersion: number;
  data: [
    {
      url: string;
      path: string;
      name: string;
      preprocess: [string] | [];
      lastUpdated: Date;
    },
  ] | [];
}
