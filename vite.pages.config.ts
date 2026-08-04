import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.PAGES_BASE ?? "/SteelSignal/",
  plugins: [react()],
  publicDir: "../public",
  build: {
    chunkSizeWarningLimit: 600,
    emptyOutDir: true,
    outDir: "../pages-dist",
  },
  root: "pages-static",
});
