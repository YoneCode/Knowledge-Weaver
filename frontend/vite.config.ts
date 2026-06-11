import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// In production the dashboard is mounted at /app/ on the same origin as the
// landing (Cloudflare Pages serves both from one project). In dev it's served
// at the root of its own port.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/app/" : "/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    target: "es2020",
  },
}));
