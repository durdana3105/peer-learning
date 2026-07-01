import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  base: "/", // keep Vite assets rooted at the site base
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],

  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Forward /api requests to the Express backend during development so the
    // OpenRouter API key stays on the server and is never included in the bundle.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));