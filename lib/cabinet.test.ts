import { describe, expect, it } from "vitest"
import { canSubmit, minorOfRubles, rublesOfMinor, tagsOfText, textOfTags } from "./cabinet"

describe("minorOfRubles", () => {
  it("turns rubles into kopecks", () => {
    expect(minorOfRubles("1500")).toBe(150000)
    expect(minorOfRubles("1 500,50")).toBe(150050)
    expect(minorOfRubles("0.1")).toBe(10)
    expect(minorOfRubles("1500.5")).toBe(150050)
  })

  it("is nothing for an empty field, which means 'by agreement'", () => {
    expect(minorOfRubles("")).toBeUndefined()
    expect(minorOfRubles("   ")).toBeUndefined()
  })

  it("is null for text that is not a price", () => {
    for (const text of ["abc", "-5", "1,234", "1e5", "12 ₽", "1.2.3"]) {
      expect(minorOfRubles(text)).toBeNull()
    }
  })
})

describe("rublesOfMinor", () => {
  it("is the text to edit: whole rubles without kopecks", () => {
    expect(rublesOfMinor(150000)).toBe("1500")
    expect(rublesOfMinor(150050)).toBe("1500,50")
    expect(rublesOfMinor(5)).toBe("0,05")
    expect(rublesOfMinor(undefined)).toBe("")
  })

  it("gives back what minorOfRubles took", () => {
    for (const minor of [0, 5, 100, 150050, 99999999]) {
      expect(minorOfRubles(rublesOfMinor(minor))).toBe(minor)
    }
  })
})

describe("tagsOfText", () => {
  it("splits by commas, trims, drops empty ones and repeats", () => {
    expect(tagsOfText(" кружки, ручная работа,, кружки ,")).toEqual(["кружки", "ручная работа"])
    expect(tagsOfText("")).toEqual([])
  })

  it("gives back what textOfTags made", () => {
    expect(tagsOfText(textOfTags(["a", "b c"]))).toEqual(["a", "b c"])
  })
})

describe("canSubmit", () => {
  it("is true for a draft and a rejected showcase only", () => {
    expect(canSubmit("DRAFT")).toBe(true)
    expect(canSubmit("REJECTED")).toBe(true)
    for (const status of ["PENDING_REVIEW", "PUBLISHED", "WITHDRAWN"] as const) {
      expect(canSubmit(status)).toBe(false)
    }
  })
})
