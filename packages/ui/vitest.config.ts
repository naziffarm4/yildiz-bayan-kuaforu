import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@yildiz/types": path.resolve(__dirname, "../types/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
  },
});
