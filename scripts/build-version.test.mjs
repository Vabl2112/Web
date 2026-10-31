import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"
import { computeBuildVersion } from "./build-version.mjs"

const directories = []

function repositoryWithCommitAt(isoDate) {
  const directory = mkdtempSync(join(tmpdir(), "egg-web-version-"))
  directories.push(directory)
  const git = (args, env = {}) =>
    execFileSync("git", args, { cwd: directory, env: { ...process.env, ...env }, stdio: "ignore" })
  git(["init", "-q"])
  git(
    ["-c", "user.name=test", "-c", "user.email=test@example.org", "-c", "commit.gpgsign=false", "commit", "-q", "--allow-empty", "-m", "c"],
    { GIT_AUTHOR_DATE: isoDate, GIT_COMMITTER_DATE: isoDate },
  )
  return directory
}

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

describe("computeBuildVersion", () => {
  test("is the commit time in Unix seconds, the same on every call for one commit", () => {
    const directory = repositoryWithCommitAt("2026-01-02T03:04:05Z")
    const expected = Date.parse("2026-01-02T03:04:05Z") / 1000
    expect(computeBuildVersion({ cwd: directory, env: {} })).toBe(expected)
    expect(computeBuildVersion({ cwd: directory, env: {} })).toBe(expected)
  })

  test("a newer commit gives a bigger number", () => {
    const older = repositoryWithCommitAt("2026-01-02T03:04:05Z")
    const newer = repositoryWithCommitAt("2026-01-03T03:04:05Z")
    expect(computeBuildVersion({ cwd: newer, env: {} })).toBeGreaterThan(computeBuildVersion({ cwd: older, env: {} }))
  })

  test("fails without git history instead of inventing a number", () => {
    const directory = mkdtempSync(join(tmpdir(), "egg-web-no-git-"))
    directories.push(directory)
    expect(() => computeBuildVersion({ cwd: directory, env: {} })).toThrow(/cannot read the commit time from git/)
  })

  test("takes an explicit EGG_WEB_VERSION and validates it", () => {
    expect(computeBuildVersion({ env: { EGG_WEB_VERSION: "1761900000" } })).toBe(1761900000)
    expect(() => computeBuildVersion({ env: { EGG_WEB_VERSION: "abc" } })).toThrow(/expected a positive integer/)
    expect(() => computeBuildVersion({ env: { EGG_WEB_VERSION: "0" } })).toThrow(/expected a positive integer/)
  })
})
