import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    // Concurrency tests share one Postgres instance; running suites in parallel
    // would corrupt each other's row counts.
    fileParallelism: false,
  },
});
