import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/tests/e2e/**"],
    passWithNoTests: true,
  },
});
