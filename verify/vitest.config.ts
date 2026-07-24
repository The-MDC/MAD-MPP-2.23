import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the "@/..." path alias the app uses (mirrors tsconfig `paths`) so the
// pure lib modules import identically under vitest and under next/tsc.
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": dirname },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
