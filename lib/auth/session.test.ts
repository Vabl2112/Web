import { describe, expect, it } from "vitest"
import { isPublicKey } from "./session"

describe("isPublicKey", () => {
  it("keeps what is read for everybody when the person changes", () => {
    expect(isPublicKey("features")).toBe(true)
    expect(isPublicKey("categories")).toBe(true)
    expect(isPublicKey("cities-mosk")).toBe(true)
  })

  it("forgets everything that belongs to a person", () => {
    for (const key of ["session", "conversations", "inbox-summary", "conversation-abc", "my-creator-profile", "my-listings", "admin-metrics-inquiries"]) {
      expect(isPublicKey(key), key).toBe(false)
    }
  })

  it("forgets a key that is not a plain string, because it is not known to be public", () => {
    expect(isPublicKey(["features", 1])).toBe(false)
    expect(isPublicKey(null)).toBe(false)
  })
})
