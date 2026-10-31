import { execFileSync } from "node:child_process"
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"
import { contractFiles, syncContract, verifyChecksums } from "./contract.mjs"

const directories = []

function temporaryDirectory(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix))
  directories.push(directory)
  return directory
}

// A throwaway "egg-backend" repository. autocrlf is off, so the committed content keeps exactly the line endings given here.
function backendRepository(files) {
  const directory = temporaryDirectory("egg-contract-backend-")
  const git = (...args) => execFileSync("git", ["-C", directory, "-c", "core.autocrlf=false", ...args], { stdio: "ignore" })
  git("init", "-q")
  commit(directory, files, "first")
  return directory
}

function commit(directory, files, message) {
  const git = (...args) => execFileSync("git", ["-C", directory, "-c", "core.autocrlf=false", ...args], { stdio: "ignore" })
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(directory, path)), { recursive: true })
    writeFileSync(join(directory, path), content)
  }
  git("add", "-A")
  git("-c", "user.name=test", "-c", "user.email=test@example.org", "-c", "commit.gpgsign=false", "commit", "-q", "-m", message)
  return execFileSync("git", ["-C", directory, "rev-parse", "HEAD"], { encoding: "utf8" }).trim()
}

const versionOne = {
  "contract/openapi/egg-v1.yaml": "openapi: 3.0.3\npaths: {}\n",
  "contract/VERSION": "0.1.0\n",
  "docs/acceptance-criteria.md": "| AC-01 | text |\n",
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("syncContract", () => {
  test("copies the committed files, records the commit and the hashes", () => {
    const backend = backendRepository(versionOne)
    const target = join(temporaryDirectory("egg-contract-web-"), "contract")
    const { commit: ref, version } = syncContract({ backendDir: backend, targetDir: target })

    expect(version).toBe("0.1.0")
    expect(readFileSync(join(target, "egg-v1.yaml"), "utf8")).toBe(versionOne["contract/openapi/egg-v1.yaml"])
    expect(readFileSync(join(target, "BACKEND_REF"), "utf8")).toBe(`${ref}\n`)
    expect(readFileSync(join(target, "SHA256SUMS"), "utf8").trim().split("\n")).toHaveLength(contractFiles.length)
    expect(verifyChecksums(target)).toEqual([])
  })

  test("takes the content of a tag, not of the newer HEAD", () => {
    const backend = backendRepository(versionOne)
    execFileSync("git", ["-C", backend, "tag", "contract-v0.1.0"])
    commit(backend, { "contract/VERSION": "0.2.0\n", "contract/openapi/egg-v1.yaml": "openapi: 3.0.3\npaths: {x: 1}\n" }, "second")

    const target = join(temporaryDirectory("egg-contract-web-"), "contract")
    expect(syncContract({ backendDir: backend, ref: "contract-v0.1.0", targetDir: target }).version).toBe("0.1.0")
    expect(syncContract({ backendDir: backend, targetDir: target }).version).toBe("0.2.0")
  })

  test("reads the committed content, ignoring uncommitted changes of the working tree", () => {
    const backend = backendRepository(versionOne)
    writeFileSync(join(backend, "contract/VERSION"), "9.9.9\n")
    const target = join(temporaryDirectory("egg-contract-web-"), "contract")
    expect(syncContract({ backendDir: backend, targetDir: target }).version).toBe("0.1.0")
  })

  test("writes LF even when the backend committed CRLF", () => {
    const crlf = { ...versionOne, "contract/openapi/egg-v1.yaml": "openapi: 3.0.3\r\npaths: {}\r\n" }
    const backend = backendRepository(crlf)
    const target = join(temporaryDirectory("egg-contract-web-"), "contract")
    syncContract({ backendDir: backend, targetDir: target })
    expect(readFileSync(join(target, "egg-v1.yaml"), "utf8")).toBe("openapi: 3.0.3\npaths: {}\n")
  })

  test("fails for a ref that is not a commit", () => {
    const backend = backendRepository(versionOne)
    expect(() => syncContract({ backendDir: backend, ref: "contract-v9", targetDir: temporaryDirectory("egg-contract-web-") })).toThrow(
      /is not a commit/,
    )
  })
})

describe("verifyChecksums", () => {
  function syncedCopy() {
    const target = join(temporaryDirectory("egg-contract-web-"), "contract")
    syncContract({ backendDir: backendRepository(versionOne), targetDir: target })
    return target
  }

  test("a hand-edited file is reported", () => {
    const target = syncedCopy()
    writeFileSync(join(target, "egg-v1.yaml"), "openapi: 3.0.3\npaths: {changed: 1}\n")
    expect(verifyChecksums(target)).toEqual([expect.stringContaining("egg-v1.yaml differs from the synced copy")])
  })

  test("a missing file and a missing checksum list are reported", () => {
    const target = syncedCopy()
    rmSync(join(target, "VERSION"))
    expect(verifyChecksums(target)).toEqual([expect.stringContaining("VERSION is missing")])
    rmSync(join(target, "SHA256SUMS"))
    expect(verifyChecksums(target)).toEqual([expect.stringContaining("SHA256SUMS is missing")])
  })

  test("CRLF line endings of an unchanged file are not a difference", () => {
    const target = syncedCopy()
    writeFileSync(join(target, "egg-v1.yaml"), "openapi: 3.0.3\r\npaths: {}\r\n")
    expect(verifyChecksums(target)).toEqual([])
  })
})
