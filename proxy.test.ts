import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { config, proxy } from "./proxy"

const request = (path: string, cookie?: string) => new NextRequest(`http://localhost${path}`, cookie ? { headers: { cookie } } : undefined)

describe("proxy", () => {
  it("sends a guest from a page that needs a session to the login page, with the way back", () => {
    const response = proxy(request("/cabinet/listings?page=2"))

    expect(response.status).toBe(307)
    const location = new URL(response.headers.get("location") ?? "")
    expect(location.pathname).toBe("/login")
    expect(location.searchParams.get("returnTo")).toBe("/cabinet/listings?page=2")
  })

  it("lets a request with the marker cookie through, whatever the cookie says about roles", () => {
    const response = proxy(request("/admin/moderation", "egg_session=1"))

    expect(response.headers.get("location")).toBeNull()
    expect(response.headers.get("x-middleware-next")).toBe("1")
  })

  it("does not count an empty marker (a session that has ended)", () => {
    expect(proxy(request("/messages", "egg_session=")).headers.get("location")).not.toBeNull()
  })

  it("covers the cabinet, the messages and the administration, and nothing else", () => {
    expect(config.matcher).toEqual(["/cabinet/:path*", "/messages/:path*", "/admin/:path*"])
  })
})
