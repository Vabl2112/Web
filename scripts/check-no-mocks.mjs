import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { pathToFileURL } from "node:url"

/**
 * Finds what the v1 UI must not contain any more (AC-30, AC-31): data of the old mock backend and features that are out of
 * scope. Until P5.5 it only warns; set EGG_NO_MOCKS_STRICT=1 or pass --strict to make findings fail the run.
 */
export const rules = [
  { id: "AC-30 city literal", pattern: /Москва/u },
  { id: "AC-30 metro station", pattern: /(?<![\p{L}])м\.\s?\p{Lu}/u },
  { id: "AC-30 tattoo master", pattern: /тату-мастер/u },
  { id: "AC-30 stock photo host", pattern: /images\.unsplash\.com/u },
  { id: "AC-30 mock name", pattern: /Алексей/u },
  { id: "AC-31 calculator", pattern: /CalculatorCard/u },
  { id: "AC-31 reviews", pattern: /ReviewsCard/u },
  { id: "AC-31 cart", pattern: /ShoppingCart/u },
  { id: "AC-31 verified badge", pattern: /(?<![\p{L}])Проверен(?![\p{L}])/u },
  { id: "AC-31 booking call to action", pattern: /Записаться/u },
]

const scannedDirectories = ["app", "components", "lib"]
const skippedName = /(^|[\\/])(node_modules|\.next|__fixtures__|fixtures)([\\/]|$)|\.test\.[cm]?[jt]sx?$/

/** The rules that match a piece of text. */
export function scanText(text) {
  return rules.filter((rule) => rule.pattern.test(text)).map((rule) => rule.id)
}

function* files(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    if (skippedName.test(path)) continue
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.[cm]?[jt]sx?$/.test(entry)) yield path
  }
}

export function scanProject(root) {
  const findings = []
  if (existsSync(join(root, "app", "api"))) {
    findings.push({ rule: "AC-30 app/api exists", where: "app/api" })
  }
  for (const name of scannedDirectories) {
    const directory = join(root, name)
    if (!existsSync(directory)) continue
    for (const file of files(directory)) {
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          for (const rule of scanText(line)) {
            findings.push({ rule, where: `${relative(root, file).replaceAll("\\", "/")}:${index + 1}` })
          }
        })
    }
  }
  return findings
}

function main(argv) {
  const strict = argv.includes("--strict") || process.env.EGG_NO_MOCKS_STRICT === "1"
  const findings = scanProject(process.cwd())
  const byRule = new Map()
  for (const { rule } of findings) byRule.set(rule, (byRule.get(rule) ?? 0) + 1)
  for (const [rule, count] of byRule) console.log(`${rule}: ${count}`)
  console.log(`check-no-mocks: ${findings.length} finding(s), ${strict ? "strict mode" : "warning only until P5.5"}`)
  if (strict && findings.length > 0) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
