import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: process.env.PAGES_BASE ?? "/SteelSignal/",
  plugins: [react()],
  publicDir: "../public",
  build: {
    chunkSizeWarningLimit: 600,
    emptyOutDir: true,
    outDir: "../pages-dist",
    rollupOptions: {
      input: {
        arctic: fileURLToPath(new URL("./pages-static/index.html", import.meta.url)),
        steel: fileURLToPath(new URL("./pages-static/steel/index.html", import.meta.url)),
      },
    },
  },
  root: "pages-static",
});
