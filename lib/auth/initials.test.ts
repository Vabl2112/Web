import { describe, expect, it } from "vitest"
import { initialsOf } from "./initials"

describe("initialsOf", () => {
  it("is the first letter of the name, in capitals", () => {
    expect(initialsOf("анна")).toBe("А")
    expect(initialsOf("  bob")).toBe("B")
  })

  it("skips a leading mark that is not a letter", () => {
    expect(initialsOf("«Алексей»")).toBe("А")
    expect(initialsOf("1 Anna")).toBe("A")
  })

  it("is a question mark for a name without letters", () => {
    expect(initialsOf("")).toBe("?")
    expect(initialsOf("123")).toBe("?")
  })
})
