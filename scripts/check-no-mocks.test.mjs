import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, test } from "vitest"
import { proxyProblems, scanProject, scanText } from "./check-no-mocks.mjs"

// The self-check required by AC-30 and AC-31: the patterns must hit what they are meant to hit and nothing else.
describe("check-no-mocks patterns", () => {
  test("a metro station triggers, an ordinary abbreviation does not", () => {
    expect(scanText("м. Таганская")).toContain("AC-30 metro station")
    expect(scanText("См. ниже")).not.toContain("AC-30 metro station")
    // A capital after the abbreviation is what the look-behind guards against ("См. Ниже" is not a station).
    expect(scanText("См. Ниже")).not.toContain("AC-30 metro station")
  })

  test("the old mock data triggers", () => {
    expect(scanText("Москва")).toContain("AC-30 city literal")
    expect(scanText("лучший тату-мастер")).toContain("AC-30 tattoo master")
    expect(scanText("Тату-мастера")).toContain("AC-30 tattoo master")
    expect(scanText("Витрины по статусам")).not.toContain("AC-30 tattoo master")
    expect(scanText("https://images.unsplash.com/photo-1")).toContain("AC-30 stock photo host")
    expect(scanText("Алексей")).toContain("AC-30 mock name")
  })

  test("the verified badge triggers, the word 'checked' does not", () => {
    expect(scanText("<Badge>Проверен</Badge>")).toContain("AC-31 verified badge")
    expect(scanText("Проверено")).not.toContain("AC-31 verified badge")
  })

  test("the out-of-scope features trigger", () => {
    expect(scanText("<CalculatorCard />")).toContain("AC-31 calculator")
    expect(scanText("<ReviewsCard />")).toContain("AC-31 reviews")
    expect(scanText("<ShoppingCart />")).toContain("AC-31 cart")
    expect(scanText("Записаться на сеанс")).toContain("AC-31 booking call to action")
  })

  test("a long-lived connection triggers (AC-26), the word inside another does not", () => {
    expect(scanText("new WebSocket(url)")).toContain("AC-26 WebSocket")
    expect(scanText("const source = new EventSource(url)")).toContain("AC-26 EventSource")
    expect(scanText("MyWebSocketLike")).not.toContain("AC-26 WebSocket")
  })

  test("clean text has no findings", () => {
    expect(scanText("Показать ещё")).toEqual([])
  })
})

describe("proxyProblems (AC-40 (а))", () => {
  const good = `
    // does not decode a token and does not know the roles
    export const SESSION_MARKER_COOKIE = "egg_session"
    export function proxy(request) { return request.cookies.get(SESSION_MARKER_COOKIE) }
    export const config = { matcher: ["/cabinet/:path*", "/admin/:path*"] }
  `

  test("a proxy that only looks for the marker cookie is fine, whatever its comments say", () => {
    expect(proxyProblems(good)).toEqual([])
  })

  test("a proxy that does not look for the marker is not", () => {
    expect(proxyProblems("export function proxy() {}")).toContain("does not look for the egg_session marker cookie")
  })

  test("a proxy that reads the token cookie, decodes a token or looks at roles is not", () => {
    expect(proxyProblems(`${good}\nrequest.cookies.get("egg_sid")`)).toContain("reads the cookie with the session token")
    expect(proxyProblems(`${good}\nconst data = JSON.parse(atob(token))`)).toContain("decodes a token or looks at roles")
    expect(proxyProblems(`${good}\nif (account.roles.includes("ADMIN")) {}`)).toContain("decodes a token or looks at roles")
  })
})

describe("scanProject", () => {
  const roots = []
  const project = (files) => {
    const root = mkdtempSync(join(tmpdir(), "egg-no-mocks-"))
    roots.push(root)
    for (const [name, text] of Object.entries(files)) {
      const path = join(root, name)
      mkdirSync(join(path, ".."), { recursive: true })
      writeFileSync(path, text)
    }
    return root
  }
  afterEach(() => roots.splice(0).forEach((root) => rmSync(root, { recursive: true, force: true })))

  const proxy = 'export const c = "egg_session"\n'

  test("a clean project has no findings", () => {
    expect(scanProject(project({ "proxy.ts": proxy, "app/page.tsx": "export default function Page() { return null }" }))).toEqual([])
  })

  test("finds a mock route, a forbidden word with its place, and a missing proxy", () => {
    const findings = scanProject(project({ "app/api/masters/route.ts": "export {}", "app/page.tsx": "ok\nМосква" }))

    expect(findings).toContainEqual({ rule: "AC-30 app/api exists", where: "app/api" })
    expect(findings).toContainEqual({ rule: "AC-30 city literal", where: "app/page.tsx:2" })
    expect(findings).toContainEqual({ rule: "AC-40 proxy.ts", where: "proxy.ts is missing" })
  })

  test("does not scan tests, so a test may name what is forbidden", () => {
    expect(scanProject(project({ "proxy.ts": proxy, "lib/a.test.ts": "Москва" }))).toEqual([])
  })

  test("finds a socket in the proxy file too", () => {
    expect(scanProject(project({ "proxy.ts": `${proxy}new WebSocket(url)` }))).toContainEqual({ rule: "AC-26 WebSocket", where: "proxy.ts:2" })
  })

  test("this project is clean: nothing of the old mock is left", () => {
    expect(scanProject(process.cwd())).toEqual([])
  })
})
