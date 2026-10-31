import { execFileSync } from "node:child_process"

/**
 * The web build number N sent as `X-EGG-Client: web/<N>`: the commit time of HEAD in Unix seconds. It is the same for CI,
 * Vercel and local builds of one commit.
 *
 * Without git history the build fails; a number is never invented. It can be given explicitly in EGG_WEB_VERSION (for a
 * Docker build that has no .git), and then it is validated like the git value.
 */
export function computeBuildVersion({ cwd = process.cwd(), env = process.env } = {}) {
  const explicit = env.EGG_WEB_VERSION
  if (explicit !== undefined && explicit !== "") {
    return parseVersion(explicit, "EGG_WEB_VERSION")
  }

  let output
  try {
    output = execFileSync("git", ["log", "-1", "--format=%ct"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
  } catch (error) {
    const reason = String(error.stderr || error.message).trim()
    throw new Error(
      `build-version: cannot read the commit time from git (${reason}). A build needs the git history; ` +
        "pass the number explicitly in EGG_WEB_VERSION when there is none.",
    )
  }
  return parseVersion(output, "git log")
}

function parseVersion(text, source) {
  const value = String(text).trim()
  if (!/^[1-9][0-9]*$/.test(value)) {
    throw new Error(`build-version: ${source} gave "${value}", expected a positive integer (Unix seconds)`)
  }
  return Number(value)
}
