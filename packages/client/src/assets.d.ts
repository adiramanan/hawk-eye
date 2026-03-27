declare module '*.svg' {
  const src: string;
  export default src;
}

interface ImportMetaEnv {
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
  readonly hot?: {
    on<T>(event: string, cb: (payload: T) => void): void;
    off?<T>(event: string, cb: (payload: T) => void): void;
    send?<T>(event: string, payload?: T): void;
  };
}
