import { readFileSync } from "node:fs"
import { pathToFileURL } from "node:url"

/**
 * Decides EGG_CLIENTS_WEB_MIN_SUPPORTED for a deploy of a Web and backend pair (D4 of the plan, AC-29).
 *
 * Old browser tabs older than this build get `426` and are asked to reload. The value rises only when the backend that is
 * being deployed has a breaking contract change newer than the contract that is deployed now; otherwise the current value
 * stays. The deployed contract version comes from `GET /api/v1/meta/client-versions` (`contractVersion`) and is empty on the
 * first deploy.
 */

/** The sections of contract/CHANGELOG.md: `## <version> ...` headings; a section with "(breaking)" is a breaking one. */
export function parseChangelog(text) {
  const sections = []
  let current = null
  for (const line of text.split(/\r?\n/)) {
    const heading = /^##\s+(\d+\.\d+\.\d+)\b/.exec(line)
    if (heading) {
      current = { version: heading[1], breaking: false }
      sections.push(current)
    } else if (current && /\(breaking\)/i.test(line)) {
      current.breaking = true
    }
  }
  return sections
}

/** Compares two MAJOR.MINOR.PATCH versions: negative, zero or positive. */
export function compareVersions(a, b) {
  const left = a.split(".").map(Number)
  const right = b.split(".").map(Number)
  for (let index = 0; index < 3; index++) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

export function computeMinSupported({ changelog, deployedVersion, currentMinSupported, webVersion }) {
  if (!deployedVersion) return webVersion // the first deploy: nothing is deployed yet

  const breakingIsNewer = parseChangelog(changelog).some(
    (section) => section.breaking && compareVersions(section.version, deployedVersion) > 0,
  )
  if (breakingIsNewer) return webVersion

  return currentMinSupported ?? webVersion // no value recorded yet counts as a first deploy
}

function optionalNumber(value) {
  return value === undefined || value === "" ? undefined : Number(value)
}

function main(argv) {
  const options = {}
  for (let index = 0; index < argv.length; index += 2) {
    options[argv[index].replace(/^--/, "")] = argv[index + 1]
  }
  const webVersion = optionalNumber(options["web-version"])
  if (!options.changelog || !Number.isInteger(webVersion)) {
    throw new Error(
      "usage: node scripts/compute-min-supported.mjs --changelog <file> --web-version <N> " +
        '[--deployed-version <x.y.z or "">] [--current <N or "">]',
    )
  }
  const result = computeMinSupported({
    changelog: readFileSync(options.changelog, "utf8"),
    deployedVersion: options["deployed-version"] || undefined,
    currentMinSupported: optionalNumber(options.current),
    webVersion,
  })
  process.stdout.write(`${result}\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
