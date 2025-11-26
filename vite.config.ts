import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
// compute absolute path to ./src using import.meta
const srcPath = new URL('./src', import.meta.url).pathname;

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode?: string }) => ({
  server: {
      host: true,
      port: Number(process.env.VITE_PORT ?? 5173),
      strictPort: false,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcPath,
    },
  },
}));
