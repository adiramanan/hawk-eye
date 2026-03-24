declare module '*.svg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
