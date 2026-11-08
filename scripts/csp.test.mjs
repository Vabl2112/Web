import { describe, expect, it } from "vitest"
import { contentSecurityPolicy } from "./csp.mjs"

const directive = (policy, name) => policy.split("; ").find((part) => part.startsWith(`${name} `))

describe("contentSecurityPolicy", () => {
  it("lets images come from this site and from the media origin only", () => {
    const policy = contentSecurityPolicy({ mediaOrigin: "https://media.example.org/media/" })

    expect(directive(policy, "img-src")).toBe("img-src 'self' data: https://media.example.org")
  })

  it("has no media origin when none is given", () => {
    expect(directive(contentSecurityPolicy(), "img-src")).toBe("img-src 'self' data:")
    expect(directive(contentSecurityPolicy({ mediaOrigin: "  " }), "img-src")).toBe("img-src 'self' data:")
  })

  it("stops the build for a media origin that is not an address", () => {
    expect(() => contentSecurityPolicy({ mediaOrigin: "media" })).toThrow()
  })

  it("forbids framing, plugins, other bases and forms to other sites", () => {
    const policy = contentSecurityPolicy()

    expect(directive(policy, "frame-ancestors")).toBe("frame-ancestors 'none'")
    expect(directive(policy, "object-src")).toBe("object-src 'none'")
    expect(directive(policy, "base-uri")).toBe("base-uri 'self'")
    expect(directive(policy, "form-action")).toBe("form-action 'self'")
    expect(directive(policy, "default-src")).toBe("default-src 'self'")
  })

  it("allows eval only in development", () => {
    expect(directive(contentSecurityPolicy({ development: true }), "script-src")).toContain("'unsafe-eval'")
    expect(directive(contentSecurityPolicy({ development: false }), "script-src")).not.toContain("'unsafe-eval'")
  })
})
