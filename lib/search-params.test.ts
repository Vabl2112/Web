import { describe, expect, it } from "vitest"
import { firstOf } from "./search-params"

describe("firstOf", () => {
  it("is the value of a single parameter", () => {
    expect(firstOf("abc")).toBe("abc")
  })

  it("is the first of a repeated parameter", () => {
    expect(firstOf(["one", "two"])).toBe("one")
  })

  it("is nothing for an absent or empty parameter", () => {
    expect(firstOf(undefined)).toBeUndefined()
    expect(firstOf("")).toBeUndefined()
    expect(firstOf([])).toBeUndefined()
  })
})
