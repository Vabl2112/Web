import { describe, expect, it } from "vitest"
import { BY_AGREEMENT, formatPrice, formatPriceFrom } from "./format"

// Intl puts a no-break space between the digits and before the sign; the tests compare with a plain one.
const plain = (text: string) => text.replace(/\s/g, " ")

describe("formatPrice", () => {
  it("shows kopecks as rubles, with the fraction only when there is one", () => {
    expect(plain(formatPrice(150000))).toBe("1 500 ₽")
    expect(plain(formatPrice(150050))).toBe("1 500,50 ₽")
    expect(plain(formatPrice(0))).toBe("0 ₽")
  })

  it("says 'by agreement' when the creator named no price (OD-20)", () => {
    expect(formatPrice(undefined)).toBe(BY_AGREEMENT)
    expect(formatPrice(null)).toBe(BY_AGREEMENT)
  })

  it("takes the currency of the contract", () => {
    expect(plain(formatPrice(250000, "USD"))).toContain("2 500")
  })
})

describe("formatPriceFrom", () => {
  it("marks a lower bound", () => {
    expect(plain(formatPriceFrom(150000))).toBe("от 1 500 ₽")
  })

  it("says 'by agreement' without a price, with no 'from' in front", () => {
    expect(formatPriceFrom(undefined)).toBe(BY_AGREEMENT)
    expect(formatPriceFrom(null)).toBe(BY_AGREEMENT)
  })
})
