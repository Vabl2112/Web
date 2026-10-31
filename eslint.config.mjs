import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Node scripts and configuration files run outside the browser.
    files: ["scripts/**/*.mjs", "*.config.mjs"],
    languageOptions: { globals: { process: "readonly", console: "readonly" } },
  },
  globalIgnores([".next/**", "out/**", "build/**", "coverage/**", "next-env.d.ts"]),
])

export default eslintConfig
