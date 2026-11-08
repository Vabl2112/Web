import { fileURLToPath } from "node:url"
import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["scripts/**/*.test.mjs", "lib/**/*.test.ts", "components/**/*.test.tsx", "*.test.ts"],
    // A committed `.only` would silently skip the other tests, so it fails the run everywhere, not only in CI.
    allowOnly: false,
  },
  resolve: {
    alias: { "@": path.resolve(path.dirname(fileURLToPath(import.meta.url))) },
  },
})
