import { defineConfig } from "vitest/config";
import path from "node:path";
import { resolveAgoraActionIcons } from "./config/agora-action-icons";

export default defineConfig({
  resolve: {
    alias: {
      ...resolveAgoraActionIcons(__dirname),
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
