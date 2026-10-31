import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

/**
 * The copy of the API contract in this repository. The source of truth is egg-backend; `contract/` holds a pinned copy of
 * the files below, the commit they came from (BACKEND_REF) and their hashes (SHA256SUMS). `lib/api/schema.d.ts` is generated
 * from the copy.
 */

/** [path in the egg-backend repository, file name in contract/] */
export const contractFiles = [
  ["contract/openapi/egg-v1.yaml", "egg-v1.yaml"],
  ["contract/VERSION", "VERSION"],
  ["docs/acceptance-criteria.md", "acceptance-criteria.md"],
]

export const schemaPath = "lib/api/schema.d.ts"

// --default-non-nullable false: fields with a default stay optional in requests (ADR 0001, spike S2 in egg-backend).
export const generatorArgs = ["contract/egg-v1.yaml", "--default-non-nullable", "false"]

// Hashes and files are compared with LF line endings, so a checkout with CRLF gives the same result.
const normalize = (text) => text.replace(/\r\n/g, "\n")
const sha256 = (text) => createHash("sha256").update(normalize(text), "utf8").digest("hex")

/**
 * Copies the contract files from a commit of a local egg-backend checkout (HEAD, a tag or any ref). The committed content is
 * read from git, not from the working tree, so the copy always matches BACKEND_REF.
 */
export function syncContract({ backendDir, ref = "HEAD", targetDir }) {
  const git = (args) =>
    execFileSync("git", ["-C", backendDir, ...args], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    })

  let commit
  try {
    commit = git(["rev-parse", "--verify", `${ref}^{commit}`]).trim()
  } catch (error) {
    throw new Error(`api-sync: "${ref}" is not a commit of ${backendDir} (${String(error.stderr || error.message).trim()})`)
  }

  mkdirSync(targetDir, { recursive: true })
  const sums = []
  for (const [from, to] of contractFiles) {
    let text
    try {
      text = normalize(git(["show", `${commit}:${from}`]))
    } catch (error) {
      throw new Error(`api-sync: ${from} is not in ${ref} (${String(error.stderr || error.message).trim()})`)
    }
    writeFileSync(join(targetDir, to), text)
    sums.push(`${sha256(text)}  ${to}`)
  }
  writeFileSync(join(targetDir, "BACKEND_REF"), `${commit}\n`)
  writeFileSync(join(targetDir, "SHA256SUMS"), `${sums.join("\n")}\n`)
  return { commit, version: readFileSync(join(targetDir, "VERSION"), "utf8").trim() }
}

/** Files of the contract copy that were changed by hand (or are missing) since the last sync; empty when all is well. */
export function verifyChecksums(targetDir) {
  const problems = []
  let recorded
  try {
    recorded = readFileSync(join(targetDir, "SHA256SUMS"), "utf8")
  } catch {
    return [`${targetDir}/SHA256SUMS is missing: run pnpm api:sync`]
  }

  const expectedNames = contractFiles.map(([, name]) => name)
  const hashes = new Map()
  for (const line of recorded.split(/\r?\n/).filter(Boolean)) {
    const match = /^([0-9a-f]{64}) {2}(.+)$/.exec(line)
    if (match) hashes.set(match[2], match[1])
    else problems.push(`SHA256SUMS has a line that cannot be read: "${line}"`)
  }

  for (const name of expectedNames) {
    if (!hashes.has(name)) {
      problems.push(`${name} is not listed in SHA256SUMS`)
      continue
    }
    let text
    try {
      text = readFileSync(join(targetDir, name), "utf8")
    } catch {
      problems.push(`${targetDir}/${name} is missing`)
      continue
    }
    if (sha256(text) !== hashes.get(name)) {
      problems.push(`${targetDir}/${name} differs from the synced copy: change the contract in egg-backend and run pnpm api:sync`)
    }
  }
  return problems
}

/** Runs openapi-typescript (the CLI of the installed package) and writes the result to `output`. */
export function generateTypes({ projectDir, output }) {
  const cli = join(projectDir, "node_modules", "openapi-typescript", "bin", "cli.js")
  try {
    execFileSync(process.execPath, [cli, ...generatorArgs, "-o", output], {
      cwd: projectDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
  } catch (error) {
    throw new Error(`openapi-typescript failed: ${String(error.stderr || error.stdout || error.message).trim()}`)
  }
}

export function readNormalized(path) {
  return normalize(readFileSync(path, "utf8"))
}
