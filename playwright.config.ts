import { defineConfig } from "@playwright/test"

/**
 * The end-to-end specs of the plan (P5.3a to P7.2). They need the whole stack: the backend, PostgreSQL, a Mailpit (or e2e/dev/mailpit-lite.mjs)
 * and the web client built and started; see docs/e2e.md. Where the browser comes from: `E2E_CHANNEL=chrome` (or `msedge`) uses the one that
 * is installed, nothing set uses the Chromium of `pnpm exec playwright install chromium`.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  // One worker: the specs share one database and the queue of moderation, and a spec that polls must not be slowed by another.
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: process.env.E2E_CHANNEL || undefined,
    locale: "ru-RU",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
})
