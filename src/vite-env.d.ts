/// <reference types="vite/client" />

declare module "*.mp3" {
  const source: string;
  export default source;
}

declare global {
  var NL_ARGS: string[] | undefined;
  var NL_DATAPATH: string | undefined;
  var NL_OS: string | undefined;
  var NL_PATH: string | undefined;
  var NL_PORT: number | undefined;
  var NL_TOKEN: string | undefined;
}

export {};
