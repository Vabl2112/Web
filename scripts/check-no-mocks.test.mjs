import { describe, expect, test } from "vitest"
import { scanText } from "./check-no-mocks.mjs"

// The self-check required by AC-30 and AC-31: the patterns must hit what they are meant to hit and nothing else.
describe("check-no-mocks patterns", () => {
  test("a metro station triggers, an ordinary abbreviation does not", () => {
    expect(scanText("м. Таганская")).toContain("AC-30 metro station")
    expect(scanText("См. ниже")).not.toContain("AC-30 metro station")
    // A capital after the abbreviation is what the look-behind guards against ("См. Ниже" is not a station).
    expect(scanText("См. Ниже")).not.toContain("AC-30 metro station")
  })

  test("the old mock data triggers", () => {
    expect(scanText("Москва")).toContain("AC-30 city literal")
    expect(scanText("лучший тату-мастер")).toContain("AC-30 tattoo master")
    expect(scanText("https://images.unsplash.com/photo-1")).toContain("AC-30 stock photo host")
    expect(scanText("Алексей")).toContain("AC-30 mock name")
  })

  test("the verified badge triggers, the word 'checked' does not", () => {
    expect(scanText("<Badge>Проверен</Badge>")).toContain("AC-31 verified badge")
    expect(scanText("Проверено")).not.toContain("AC-31 verified badge")
  })

  test("the out-of-scope features trigger", () => {
    expect(scanText("<CalculatorCard />")).toContain("AC-31 calculator")
    expect(scanText("<ReviewsCard />")).toContain("AC-31 reviews")
    expect(scanText("<ShoppingCart />")).toContain("AC-31 cart")
    expect(scanText("Записаться на сеанс")).toContain("AC-31 booking call to action")
  })

  test("clean text has no findings", () => {
    expect(scanText("Показать ещё")).toEqual([])
  })
})
