import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { pathToFileURL } from "node:url"

/**
 * Finds what the v1 UI must not contain: data of the old mock backend and features that are out of scope (AC-30, AC-31), a
 * long-lived connection (AC-26: the web client polls), and a `proxy.ts` that does more than look for the marker cookie (AC-40 (а)).
 * Any finding fails the run; `--warn` (or EGG_NO_MOCKS_WARN=1) only lists them.
 */
export const rules = [
  { id: "AC-30 city literal", pattern: /Москва/u },
  { id: "AC-30 metro station", pattern: /(?<![\p{L}])м\.\s?\p{Lu}/u },
  { id: "AC-30 tattoo master", pattern: /(?<![\p{L}])тату/iu },
  { id: "AC-30 stock photo host", pattern: /images\.unsplash\.com/u },
  { id: "AC-30 mock name", pattern: /Алексей/u },
  { id: "AC-31 calculator", pattern: /CalculatorCard/u },
  { id: "AC-31 reviews", pattern: /ReviewsCard/u },
  { id: "AC-31 cart", pattern: /ShoppingCart/u },
  { id: "AC-31 verified badge", pattern: /(?<![\p{L}])Проверен(?![\p{L}])/u },
  { id: "AC-31 booking call to action", pattern: /Записаться/u },
  { id: "AC-26 WebSocket", pattern: /\bWebSocket\b/u },
  { id: "AC-26 EventSource", pattern: /\bEventSource\b/u },
]

const scannedDirectories = ["app", "components", "lib"]
const scannedFiles = ["proxy.ts"]
const skippedName = /(^|[\\/])(node_modules|\.next|__fixtures__|fixtures)([\\/]|$)|\.test\.[cm]?[jt]sx?$/

/** The rules that match a piece of text. */
export function scanText(text) {
  return rules.filter((rule) => rule.pattern.test(text)).map((rule) => rule.id)
}

/**
 * What is wrong with the source of `proxy.ts`. It may only look for the marker cookie `egg_session` and send a guest to the login
 * page: it must not read the token cookie, decode a token or look at roles, because the API alone decides who may do what (AC-40 (а)).
 * Comments are left out, so they may say what the file does not do.
 */
export function proxyProblems(source) {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
  const problems = []
  if (!/egg_session/.test(code)) problems.push("does not look for the egg_session marker cookie")
  if (/egg_sid/.test(code)) problems.push("reads the cookie with the session token")
  // The names of the roles are in capitals; the path `/admin/...` of the matcher is not a role.
  if (/\b(roles?|jwt|jose|atob|btoa)\b/i.test(code) || /\b(ADMIN|CREATOR)\b|JSON\.parse/.test(code)) {
    problems.push("decodes a token or looks at roles")
  }
  return problems
}

function* files(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (skippedName.test(path)) continue
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.[cm]?[jt]sx?$/.test(entry)) yield path
  }
}

function scanFile(root, file, findings) {
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      for (const rule of scanText(line)) {
        findings.push({ rule, where: `${relative(root, file).replaceAll("\\", "/")}:${index + 1}` })
      }
    })
}

export function scanProject(root) {
  const findings = []
  if (existsSync(join(root, "app", "api"))) {
    findings.push({ rule: "AC-30 app/api exists", where: "app/api" })
  }
  for (const name of scannedDirectories) {
    const directory = join(root, name)
    if (!existsSync(directory)) continue
    for (const file of files(directory)) scanFile(root, file, findings)
  }
  for (const name of scannedFiles) {
    const file = join(root, name)
    if (existsSync(file)) scanFile(root, file, findings)
  }
  const proxy = join(root, "proxy.ts")
  if (!existsSync(proxy)) {
    findings.push({ rule: "AC-40 proxy.ts", where: "proxy.ts is missing" })
  } else {
    for (const problem of proxyProblems(readFileSync(proxy, "utf8"))) {
      findings.push({ rule: "AC-40 proxy.ts", where: `proxy.ts ${problem}` })
    }
  }
  return findings
}

const MAX_LISTED = 30

function main(argv) {
  const warnOnly = argv.includes("--warn") || process.env.EGG_NO_MOCKS_WARN === "1"
  const findings = scanProject(process.cwd())
  for (const { rule, where } of findings.slice(0, MAX_LISTED)) console.log(`${rule}: ${where}`)
  if (findings.length > MAX_LISTED) console.log(`... and ${findings.length - MAX_LISTED} more`)
  console.log(`check-no-mocks: ${findings.length} finding(s)${warnOnly ? ", warning only" : ""}`)
  if (!warnOnly && findings.length > 0) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
