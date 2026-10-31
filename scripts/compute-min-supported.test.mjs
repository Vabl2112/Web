import { describe, expect, test } from "vitest"
import { compareVersions, computeMinSupported, parseChangelog } from "./compute-min-supported.mjs"

// The shape of contract/CHANGELOG.md of the backend: a heading per version, "(breaking)" marks a breaking change.
const changelog = `# Contract changelog

## 0.3.0 (unreleased)
- Added a field.

## 0.2.0 (2026-11-01)
- Removed the field status (breaking).

## 0.1.0 (2026-10-26)
- First version.
`

const web = 1800000000

describe("computeMinSupported", () => {
  test("a breaking entry newer than the deployed contract raises the minimum to the new build", () => {
    expect(computeMinSupported({ changelog, deployedVersion: "0.1.0", currentMinSupported: 1700000000, webVersion: web })).toBe(web)
  })

  test("without a breaking entry newer than the deployed contract the current value stays", () => {
    expect(computeMinSupported({ changelog, deployedVersion: "0.2.0", currentMinSupported: 1700000000, webVersion: web })).toBe(1700000000)
  })

  test("the first deploy sets the minimum to the new build", () => {
    expect(computeMinSupported({ changelog, deployedVersion: undefined, currentMinSupported: 1700000000, webVersion: web })).toBe(web)
    expect(computeMinSupported({ changelog, deployedVersion: "", currentMinSupported: undefined, webVersion: web })).toBe(web)
  })

  test("a deploy without a recorded value counts as a first deploy", () => {
    expect(computeMinSupported({ changelog, deployedVersion: "0.3.0", currentMinSupported: undefined, webVersion: web })).toBe(web)
  })

  test("a breaking entry of the deployed version itself does not count", () => {
    expect(computeMinSupported({ changelog, deployedVersion: "0.2.0", currentMinSupported: 5, webVersion: web })).toBe(5)
  })
})

describe("changelog parsing", () => {
  test("finds the breaking sections", () => {
    expect(parseChangelog(changelog)).toEqual([
      { version: "0.3.0", breaking: false },
      { version: "0.2.0", breaking: true },
      { version: "0.1.0", breaking: false },
    ])
  })

  test("compares versions numerically", () => {
    expect(compareVersions("0.10.0", "0.9.0")).toBeGreaterThan(0)
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0)
    expect(compareVersions("0.1.0", "0.1.1")).toBeLessThan(0)
  })
})
