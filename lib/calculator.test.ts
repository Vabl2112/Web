import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { type Calculator, FormulaError, formatWhole, initialAnswers, parseFormula, priceOf, summaryOf, valuesOf } from "@/lib/calculator"

interface Vectors {
  valid: { formula: string; values: Record<string, number>; value: number | string; names?: string[] }[]
  invalid: { formula: string; error: string }[]
}

// The cases the backend (Formula.kt) agrees on; the file is the copy of contract/calculator-vectors.json.
const vectors = JSON.parse(readFileSync("contract/calculator-vectors.json", "utf8")) as Vectors

const calculator: Calculator = {
  title: "Цена",
  currency: "RUB",
  formula: "max(3000, size * 500) * complexity",
  parameters: [
    { id: "size", label: "Размер", kind: "SLIDER", min: 5, max: 30, step: 1, defaultValue: 15, unit: "см" },
    {
      id: "complexity",
      label: "Сложность",
      kind: "CHOICE",
      options: [
        { label: "Контур", value: 1 },
        { label: "Тени", value: 1.5 },
        { label: "Цвет", value: 2 },
      ],
      defaultOption: 1,
    },
  ],
}

describe("parseFormula on the shared cases", () => {
  it.each(vectors.valid)("reads $formula", ({ formula, values, value, names }) => {
    const parsed = parseFormula(formula)
    const expected = Number(value)

    const result = parsed.evaluate(values)
    if (Number.isFinite(expected)) expect(Math.abs(result - expected)).toBeLessThan(1e-9)
    else expect(result).toBe(expected)
    if (names) expect([...parsed.names].sort()).toEqual([...names].sort())
  })

  it.each(vectors.invalid)("refuses $formula", ({ formula, error }) => {
    expect(() => parseFormula(formula)).toThrow(FormulaError)
    try {
      parseFormula(formula)
    } catch (refused) {
      expect((refused as FormulaError).code).toBe(error)
    }
  })

  it("never runs text as code: a name is only a name", () => {
    expect(parseFormula("constructor + 1").names).toEqual(["constructor"])
    expect(() => parseFormula("alert(1)")).toThrow(FormulaError)
  })
})

describe("the answers of the visitor", () => {
  it("start at the default value of a slider and the default option of a choice", () => {
    expect(initialAnswers(calculator)).toEqual({ size: 15, complexity: 1 })
  })

  it("turn into the numbers of the formula: a slider as it is, a choice as the value of the option", () => {
    expect(valuesOf(calculator, { size: 20, complexity: 2 })).toEqual({ size: 20, complexity: 2 })
    expect(valuesOf(calculator, { size: 20, complexity: 0 })).toEqual({ size: 20, complexity: 1 })
  })

  it("give the price in whole units, half up", () => {
    expect(priceOf(calculator, initialAnswers(calculator))).toBe(11250)
    expect(priceOf(calculator, { size: 5, complexity: 2 })).toBe(6000)
    expect(priceOf({ ...calculator, formula: "size / 2" }, { size: 5, complexity: 0 })).toBe(3)
  })

  it("give no price when the formula does not give a usable number", () => {
    expect(priceOf({ ...calculator, formula: "size / 0" }, initialAnswers(calculator))).toBeNull()
    expect(priceOf({ ...calculator, formula: "size - 100" }, initialAnswers(calculator))).toBeNull()
    expect(priceOf({ ...calculator, formula: "size +" }, initialAnswers(calculator))).toBeNull()
  })

  it("are put into the message to the creator with the price", () => {
    const text = summaryOf(calculator, initialAnswers(calculator)).replace(/\s/g, " ")

    expect(text).toContain("Размер: 15 см")
    expect(text).toContain("Сложность: Тени")
    expect(text).toContain("Примерная стоимость: 11 250 ₽")
    expect(formatWhole(500, "RUB").replace(/\s/g, " ")).toBe("500 ₽")
  })
})
