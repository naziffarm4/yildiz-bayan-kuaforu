import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@yildiz/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@yildiz/ui": path.resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
  },
});
