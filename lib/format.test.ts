import { describe, expect, it } from "vitest"
import { BY_AGREEMENT, experienceText, experienceYears, feedbackCountText, formatAverage, formatPrice, formatPriceFrom, pluralRu, worksCountText } from "./format"

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

describe("pluralRu and the texts made with it", () => {
  it("picks the form of the number: 1, 2 to 4, 5 and more, and the teens", () => {
    const forms = ["год", "года", "лет"] as const
    expect([1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 101, 111].map((n) => pluralRu(n, forms))).toEqual([
      "год", "года", "года", "лет", "лет", "лет", "лет", "год", "года", "лет", "год", "лет",
    ])
  })

  it("counts feedback and works", () => {
    expect(feedbackCountText(1)).toBe("1 отзыв")
    expect(feedbackCountText(3)).toBe("3 отзыва")
    expect(feedbackCountText(12)).toBe("12 отзывов")
    expect(worksCountText(21)).toBe("21 работа")
    expect(worksCountText(0)).toBe("0 работ")
  })
})

describe("experience and the average", () => {
  const now = new Date(2026, 10, 19)

  it("counts the years from the year the creator started", () => {
    expect(experienceYears(2016, now)).toBe(10)
    expect(experienceText(2016, now)).toBe("Опыт 10 лет")
    expect(experienceText(2025, now)).toBe("Опыт 1 год")
    expect(experienceText(2026, now)).toBe("Опыт меньше года")
    expect(experienceYears(2030, now)).toBe(0)
  })

  it("writes the average with one decimal place and a comma", () => {
    expect(formatAverage(4.8)).toBe("4,8")
    expect(formatAverage(5)).toBe("5,0")
  })
})
