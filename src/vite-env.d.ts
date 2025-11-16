/// <reference types="vite/client" />
/// <reference types="@pptb/types" />

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare global {
  interface Window {
    toolboxAPI: typeof import("@pptb/types").toolboxAPI;
    dataverseAPI: typeof import("@pptb/types").dataverseAPI;
  }
}

export {};
