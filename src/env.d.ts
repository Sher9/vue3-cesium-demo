/// <reference types="vite/client" />
/// <reference types="@types/node" />
/// <reference types="@types/cesium" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_CESIUM_ACCESS_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 