/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_AUTH_BYPASS?: string;
  readonly VITE_LEX_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
