import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { generateTypes, readNormalized, schemaPath, verifyChecksums } from "./contract.mjs"

/**
 * pnpm api:check: fails when the contract copy was changed without a sync (hashes in contract/SHA256SUMS) or when
 * lib/api/schema.d.ts is not what the generator makes of the copy.
 */
function main() {
  const projectDir = process.cwd()
  const problems = verifyChecksums("contract") // relative to the project directory, so the messages read "contract/..."

  if (problems.length === 0) {
    const directory = mkdtempSync(join(tmpdir(), "egg-api-check-"))
    try {
      const generated = join(directory, "schema.d.ts")
      generateTypes({ projectDir, output: generated })
      if (readNormalized(generated) !== readNormalized(join(projectDir, schemaPath))) {
        problems.push(`${schemaPath} is not what the generator makes of contract/egg-v1.yaml: run pnpm api:gen and commit it`)
      }
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }

  if (problems.length > 0) {
    console.error(`api-check failed:\n${problems.map((problem) => `  - ${problem}`).join("\n")}`)
    process.exitCode = 1
    return
  }
  console.log("api-check: the contract copy and lib/api/schema.d.ts are in sync")
}

main()
