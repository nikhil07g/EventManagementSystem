/// <reference types="node" />

// silence missing module types for build-only packages
declare module 'vite';
declare module '@vitejs/plugin-react-swc';

// ensure import.meta.url is recognized
interface ImportMeta {
  url: string;
}
