import { defineConfig } from "vitest/config";
import path from "node:path";
import { resolveAgoraActionIcons } from "./config/agora-action-icons";

export default defineConfig({
  resolve: {
    alias: {
      ...resolveAgoraActionIcons(__dirname),
      "@": path.resolve(__dirname, "./src"),
      // Next.js resolves "server-only" itself; under Vitest it does not exist,
      // which made every module carrying the guard untestable.
      "server-only": path.resolve(__dirname, "./config/test-stubs/server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Only collected with `--coverage` (`npm run test:ci`, used by the GitLab pipeline):
    // lcov for SonarQube, cobertura for the MR coverage widget, text for the job's coverage regex.
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "cobertura"],
      reportsDirectory: "coverage",
      reportOnFailure: true,
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**"],
    },
  },
});
