import { execFileSync } from "node:child_process"
import { join, resolve } from "node:path"
import { generateTypes, contractFiles, schemaPath, syncContract } from "./contract.mjs"

/**
 * pnpm api:sync [--from <egg-backend checkout>] [--ref <git ref>]
 *
 * Copies the API contract from a local checkout of egg-backend (default: ../egg-backend or EGG_BACKEND_DIR) at a git ref
 * (default HEAD, for example contract-v0.1.0), records the commit in contract/BACKEND_REF and the hashes in
 * contract/SHA256SUMS, and regenerates lib/api/schema.d.ts.
 */
function main(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 2) {
    options[argv[index].replace(/^--/, "")] = argv[index + 1]
  }
  const projectDir = process.cwd()
  const backendDir = resolve(options.from ?? process.env.EGG_BACKEND_DIR ?? join(projectDir, "..", "egg-backend"))
  const ref = options.ref ?? "HEAD"

  // Only committed content is synced; tell the user when the working tree of the backend has newer, uncommitted contract changes.
  const dirty = execFileSync("git", ["-C", backendDir, "status", "--porcelain", "--", ...contractFiles.map(([from]) => from)], {
    encoding: "utf8",
  }).trim()
  if (dirty && ref === "HEAD") {
    console.warn(`api-sync: uncommitted contract changes in ${backendDir} are NOT synced:\n${dirty}`)
  }

  const { commit, version } = syncContract({ backendDir, ref, targetDir: join(projectDir, "contract") })
  generateTypes({ projectDir, output: schemaPath })
  console.log(`api-sync: contract ${version} from ${backendDir} at ${commit.slice(0, 12)}; ${schemaPath} regenerated`)
}

main(process.argv.slice(2))
