import { type Calculator, type CalculatorParameter, FormulaError, parseFormula } from "@/lib/calculator"

export const MAX_PARAMETERS = 8
export const MAX_OPTIONS = 12
export const CURRENCIES = ["RUB", "KZT", "BYN", "USD", "EUR"] as const

/** What a creator starts from when the showcase has no calculator yet: two questions and a formula that uses both. */
export const STARTER: Calculator = {
  title: "Рассчитайте стоимость",
  currency: "RUB",
  formula: "max(1000, amount * 500) * level",
  parameters: [
    { id: "amount", label: "Количество", kind: "SLIDER", min: 1, max: 10, step: 1, defaultValue: 1 },
    {
      id: "level",
      label: "Сложность",
      kind: "CHOICE",
      options: [
        { label: "Простая", value: 1 },
        { label: "Средняя", value: 1.5 },
        { label: "Сложная", value: 2 },
      ],
      defaultOption: 0,
    },
  ],
}

export function newSlider(id: string): CalculatorParameter {
  return { id, label: "Новый вопрос", kind: "SLIDER", min: 1, max: 10, step: 1, defaultValue: 1 }
}

export function newChoice(id: string): CalculatorParameter {
  return {
    id,
    label: "Новый вопрос",
    kind: "CHOICE",
    options: [
      { label: "Вариант 1", value: 1 },
      { label: "Вариант 2", value: 2 },
    ],
    defaultOption: 0,
  }
}

/** A name for a new question that no other question has: `q1`, `q2`, ... */
export function freeId(parameters: CalculatorParameter[]): string {
  const taken = new Set(parameters.map((parameter) => parameter.id))
  let number = 1
  while (taken.has(`q${number}`)) number++
  return `q${number}`
}

/** Another kind of the same question: the label and the name stay, the fields of the old kind give way to those of the new one. */
export function withKind(parameter: CalculatorParameter, kind: CalculatorParameter["kind"]): CalculatorParameter {
  if (parameter.kind === kind) return parameter
  const fresh = kind === "SLIDER" ? newSlider(parameter.id) : newChoice(parameter.id)
  return { ...fresh, label: parameter.label }
}

/**
 * What the editor can tell before it asks the server: the formula does not read, or names a question that is not there. The server checks
 * all the rest (and the same again), so this is only for the person to see it as they type.
 */
export function formulaProblem(calculator: Calculator): string | null {
  try {
    const { names } = parseFormula(calculator.formula)
    const known = new Set(calculator.parameters.map((parameter) => parameter.id))
    const unknown = names.filter((name) => !known.has(name))
    return unknown.length > 0 ? `В формуле есть имя, которого нет среди вопросов: ${unknown.join(", ")}.` : null
  } catch (error) {
    if (!(error instanceof FormulaError)) throw error
    return error.code === "FORMULA_UNKNOWN_NAME"
      ? "В формуле есть функция, которой нет. Доступны min(…) и max(…)."
      : "Формулу не удалось прочитать: проверьте скобки, знаки и запятые."
  }
}
