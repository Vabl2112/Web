import { describe, expect, it } from "vitest"
import { createApiClient, isProtectedPage, reactionTo, returnToOf, type ClientHooks } from "./client"

describe("isProtectedPage", () => {
  it("is true for the cabinet, the messages and the administration with everything below them", () => {
    expect(isProtectedPage("/cabinet")).toBe(true)
    expect(isProtectedPage("/cabinet/listings")).toBe(true)
    expect(isProtectedPage("/messages/5")).toBe(true)
    expect(isProtectedPage("/admin/moderation")).toBe(true)
  })

  it("is false for the public pages, also for a name that only starts the same way", () => {
    expect(isProtectedPage("/masters")).toBe(false)
    expect(isProtectedPage("/cabinets")).toBe(false)
    expect(isProtectedPage("/")).toBe(false)
  })
})

describe("reactionTo", () => {
  const me = { method: "GET", path: "/v1/me" }
  const other = { method: "POST", path: "/v1/conversations" }

  it("asks for a reload on 426, wherever the person is", () => {
    expect(reactionTo(426, other, "/masters")).toBe("upgrade")
    expect(reactionTo(426, me, "/cabinet")).toBe("upgrade")
  })

  it("takes 401 of GET /v1/me for the answer 'a guest', not for a failure", () => {
    expect(reactionTo(401, me, "/cabinet")).toBe("guest")
    expect(reactionTo(401, me, "/masters")).toBe("guest")
  })

  it("sends the person to the login page when a page that needs a session gets 401", () => {
    expect(reactionTo(401, other, "/messages")).toBe("login")
  })

  it("only offers to sign in when a public page gets 401", () => {
    expect(reactionTo(401, other, "/masters")).toBe("offer-login")
  })

  it("does not react to any other status", () => {
    for (const status of [200, 400, 403, 404, 429, 500]) {
      expect(reactionTo(status, other, "/cabinet")).toBe("none")
    }
  })

  it("leaves 401 of the login and the logout to the form: it is a wrong password, or no session to end", () => {
    expect(reactionTo(401, { method: "POST", path: "/v1/auth/login" }, "/login")).toBe("none")
    expect(reactionTo(401, { method: "POST", path: "/v1/auth/logout" }, "/cabinet")).toBe("none")
  })

  it("treats a POST to /v1/me as an ordinary call", () => {
    expect(reactionTo(401, { method: "POST", path: "/v1/me" }, "/masters")).toBe("offer-login")
  })
})

describe("returnToOf", () => {
  it("keeps the path and the query of this site", () => {
    expect(returnToOf("/cabinet/listings", "?page=2")).toBe("/cabinet/listings?page=2")
  })

  it("never returns the person to another site", () => {
    expect(returnToOf("//evil.example", "")).toBe("/")
    expect(returnToOf("https://evil.example", "")).toBe("/")
    expect(returnToOf("/\\evil.example", "")).toBe("/")
    expect(returnToOf("", "")).toBe("/")
  })

  it("is not fooled by the characters that a browser drops from an address", () => {
    expect(returnToOf("/\t/evil.example", "")).toBe("/")
    expect(returnToOf("/\n/evil.example", "")).toBe("/")
    expect(returnToOf("/\r/evil.example", "")).toBe("/")
    expect(returnToOf("/", "?next=\t//evil.example")).toBe("/")
    expect(returnToOf("/\u0000/evil.example", "")).toBe("/")
  })

  it("keeps an encoded tab, which is only a part of a path of this site", () => {
    expect(returnToOf("/%09/evil.example", "")).toBe("/%09/evil.example")
  })

  it("gives back a plain path, with the dots resolved", () => {
    expect(returnToOf("/cabinet/../messages", "")).toBe("/messages")
  })
})

describe("createApiClient", () => {
  const problem = (status: number, code: string) =>
    new Response(JSON.stringify({ title: "t", status, code }), { status, headers: { "content-type": "application/problem+json" } })

  function setup(respond: () => Response, location = { pathname: "/masters", search: "" }) {
    const requests: Request[] = []
    const calls: string[] = []
    const hooks: ClientHooks = {
      onLogin: (returnTo) => calls.push(`login:${returnTo}`),
      onOfferLogin: () => calls.push("offer-login"),
      onUpgrade: () => calls.push("upgrade"),
    }
    const fakeFetch = (async (input: RequestInfo | URL) => {
      requests.push(input as Request)
      return respond()
    }) as typeof fetch
    const client = createApiClient({ baseUrl: "http://api.test/api", version: "1761900000", hooks, currentPath: () => location, fetch: fakeFetch })
    return { client, requests, calls }
  }

  it("sends X-EGG-Client with the build number on every call", async () => {
    const { client, requests } = setup(() => new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }))

    await client.POST("/v1/auth/logout")

    expect(requests[0]?.headers.get("x-egg-client")).toBe("web/1761900000")
    expect(requests[0]?.url).toBe("http://api.test/api/v1/auth/logout")
  })

  it("asks for a reload on 426", async () => {
    const { client, calls } = setup(() => problem(426, "CLIENT_UPGRADE_REQUIRED"))

    await client.POST("/v1/auth/logout")

    expect(calls).toEqual(["upgrade"])
  })

  it("does not react to 401 of GET /v1/me", async () => {
    const { client, calls } = setup(() => problem(401, "UNAUTHENTICATED"), { pathname: "/cabinet", search: "" })

    const { response } = await client.GET("/v1/me")

    expect(response.status).toBe(401)
    expect(calls).toEqual([])
  })

  it("sends the person from a page with a session to the login page, with the way back", async () => {
    const { client, calls } = setup(() => problem(401, "UNAUTHENTICATED"), { pathname: "/cabinet/listings", search: "?page=2" })

    await client.POST("/v1/auth/resend-verification")

    expect(calls).toEqual(["login:/cabinet/listings?page=2"])
  })

  it("only offers to sign in on a public page", async () => {
    const { client, calls } = setup(() => problem(401, "UNAUTHENTICATED"))

    await client.POST("/v1/auth/resend-verification")

    expect(calls).toEqual(["offer-login"])
  })

  it("does not react to a wrong password: the form shows it", async () => {
    const { client, calls } = setup(() => problem(401, "INVALID_CREDENTIALS"))

    const { response } = await client.POST("/v1/auth/login", { body: { email: "anna@example.org", password: "wrong" } })

    expect(response.status).toBe(401)
    expect(calls).toEqual([])
  })
})
