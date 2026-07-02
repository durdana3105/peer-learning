import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    projects: [
      {
        test: {
          name: "frontend",
          environment: "jsdom",
          globals: true,
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/**/*.{test,spec}.{ts,tsx}"],
          alias: { "@": path.resolve(process.cwd(), "./src") },
        },
      },
      {
        test: {
          name: "backend",
          environment: "node",
          globals: true,
          setupFiles: ["./backend/tests/setup.js"],
          include: ["backend/**/*.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "./src") },
  },
});
// issue 1107
