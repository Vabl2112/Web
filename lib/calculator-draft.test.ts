import { describe, expect, it } from "vitest"
import { STARTER, formulaProblem, freeId, newChoice, newSlider, withKind } from "@/lib/calculator-draft"

describe("the draft of a calculator", () => {
  it("starts from a calculator that has no problem", () => {
    expect(formulaProblem(STARTER)).toBeNull()
  })

  it("gives a new question a name that is free", () => {
    expect(freeId([])).toBe("q1")
    expect(freeId([newSlider("q1"), newChoice("q3")])).toBe("q2")
  })

  it("keeps the label and the name when the kind changes and drops the fields of the old kind", () => {
    const slider = { ...newSlider("size"), label: "Размер", unit: "см" }

    const choice = withKind(slider, "CHOICE")

    expect(choice).toMatchObject({ id: "size", label: "Размер", kind: "CHOICE" })
    expect(choice.options).toHaveLength(2)
    expect(choice.min).toBeUndefined()
    expect(choice.unit).toBeUndefined()
    expect(withKind(choice, "CHOICE")).toBe(choice)
  })

  it("tells a formula that does not read, a name that is not a question and a function that does not exist", () => {
    expect(formulaProblem({ ...STARTER, formula: "amount *" })).toMatch(/не удалось прочитать/)
    expect(formulaProblem({ ...STARTER, formula: "amount * colour" })).toMatch(/colour/)
    expect(formulaProblem({ ...STARTER, formula: "sqrt(amount)" })).toMatch(/функци/)
  })
})
