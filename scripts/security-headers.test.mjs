import { describe, expect, it } from "vitest"
import { securityHeaders } from "./security-headers.mjs"

const valueOf = (headers, key) => headers.find((header) => header.key === key)?.value

describe("securityHeaders", () => {
  it("carries the content security policy of the site, with the media origin", () => {
    const headers = securityHeaders({ mediaOrigin: "https://media.example.org" })

    expect(valueOf(headers, "Content-Security-Policy")).toContain("img-src 'self' data: https://media.example.org")
  })

  it("forbids sniffing and framing, and cuts the referrer to the origin for other sites", () => {
    const headers = securityHeaders()

    expect(valueOf(headers, "X-Content-Type-Options")).toBe("nosniff")
    expect(valueOf(headers, "X-Frame-Options")).toBe("DENY")
    expect(valueOf(headers, "Referrer-Policy")).toBe("strict-origin-when-cross-origin")
  })

  it("switches off the browser features that the site does not use", () => {
    const policy = valueOf(securityHeaders(), "Permissions-Policy")

    for (const feature of ["camera", "microphone", "geolocation", "payment"]) expect(policy).toContain(`${feature}=()`)
  })

  it("leaves Strict-Transport-Security to the server that ends TLS", () => {
    expect(valueOf(securityHeaders(), "Strict-Transport-Security")).toBeUndefined()
  })

  it("has each header once", () => {
    const keys = securityHeaders().map((header) => header.key)

    expect(new Set(keys).size).toBe(keys.length)
  })
})
