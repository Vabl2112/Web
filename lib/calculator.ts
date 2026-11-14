import type { components } from "@/lib/api/schema"

export type Calculator = components["schemas"]["Calculator"]
export type CalculatorParameter = components["schemas"]["CalculatorParameter"]

const MAX_DEPTH = 16
const MAX_ARGUMENTS = 8
const FUNCTIONS = new Set(["min", "max"])

export type FormulaErrorCode = "FORMULA_SYNTAX" | "FORMULA_UNKNOWN_NAME"

/** A formula that was refused; `code` is the code the API uses for the same problem. */
export class FormulaError extends Error {
  constructor(
    readonly code: FormulaErrorCode,
    message: string,
  ) {
    super(message)
  }
}

type Node = (values: Record<string, number>) => number

const isDigit = (c: string) => c >= "0" && c <= "9"
const isNameStart = (c: string) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_"
const isSpace = (c: string) => c === " " || c === "\t" || c === "\n" || c === "\r"

/**
 * The reader of formulas: numbers, names, `+ - * /`, brackets, a minus before a value and `min(...)` / `max(...)`. It builds a tree of
 * functions and never runs the text as code. It is the twin of `Formula.kt` of the backend; `contract/calculator-vectors.json` holds the
 * cases both must agree on.
 */
class Parser {
  readonly names = new Set<string>()
  private at = 0
  private depth = 0

  constructor(private readonly text: string) {}

  parseAll(): Node {
    const root = this.expression()
    this.skipSpaces()
    if (this.at < this.text.length) throw syntax(`unexpected '${this.text[this.at]}' at ${this.at + 1}`)
    return root
  }

  private skipSpaces() {
    while (this.at < this.text.length && isSpace(this.text[this.at])) this.at++
  }

  private peek(): string | undefined {
    this.skipSpaces()
    return this.text[this.at]
  }

  private accept(c: string): boolean {
    if (this.peek() !== c) return false
    this.at++
    return true
  }

  private nested<T>(read: () => T): T {
    if (++this.depth > MAX_DEPTH) throw syntax("the formula is nested too deeply")
    try {
      return read()
    } finally {
      this.depth--
    }
  }

  private expression(): Node {
    let left = this.term()
    for (;;) {
      const op = this.peek()
      if (op !== "+" && op !== "-") return left
      this.at++
      const l = left
      const r = this.term()
      left = op === "+" ? (v) => l(v) + r(v) : (v) => l(v) - r(v)
    }
  }

  private term(): Node {
    let left = this.unary()
    for (;;) {
      const op = this.peek()
      if (op !== "*" && op !== "/") return left
      this.at++
      const l = left
      const r = this.unary()
      left = op === "*" ? (v) => l(v) * r(v) : (v) => l(v) / r(v)
    }
  }

  private unary(): Node {
    if (!this.accept("-")) return this.primary()
    const inner = this.nested(() => this.unary())
    return (v) => -inner(v)
  }

  private primary(): Node {
    const c = this.peek()
    if (c === undefined) throw syntax("the formula ends too early")
    if (isDigit(c)) return this.number()
    if (isNameStart(c)) return this.nameOrCall()
    if (c === "(") {
      this.at++
      const inner = this.nested(() => this.expression())
      if (!this.accept(")")) throw syntax(`a closing bracket is missing at ${this.at + 1}`)
      return inner
    }
    throw syntax(`unexpected '${c}' at ${this.at + 1}`)
  }

  private number(): Node {
    const start = this.at
    while (this.at < this.text.length && isDigit(this.text[this.at])) this.at++
    if (this.text[this.at] === ".") {
      this.at++
      if (this.at >= this.text.length || !isDigit(this.text[this.at])) throw syntax(`a digit must follow the point at ${this.at}`)
      while (this.at < this.text.length && isDigit(this.text[this.at])) this.at++
    }
    const value = Number(this.text.slice(start, this.at))
    return () => value
  }

  private nameOrCall(): Node {
    const start = this.at
    while (this.at < this.text.length && (isNameStart(this.text[this.at]) || isDigit(this.text[this.at]))) this.at++
    const name = this.text.slice(start, this.at)
    if (this.peek() !== "(") {
      this.names.add(name)
      // `hasOwn`: a name such as `constructor` must not find something on the prototype of the object of answers.
      return (v) => (Object.hasOwn(v, name) ? v[name] : Number.NaN)
    }
    if (!FUNCTIONS.has(name)) throw new FormulaError("FORMULA_UNKNOWN_NAME", `unknown function '${name}'`)
    this.at++
    const args = [this.nested(() => this.expression())]
    while (this.accept(",")) args.push(this.nested(() => this.expression()))
    if (!this.accept(")")) throw syntax(`a closing bracket is missing at ${this.at + 1}`)
    if (args.length < 2 || args.length > MAX_ARGUMENTS) throw syntax(`'${name}' takes 2 to ${MAX_ARGUMENTS} arguments`)
    return name === "min" ? (v) => Math.min(...args.map((a) => a(v))) : (v) => Math.max(...args.map((a) => a(v)))
  }
}

function syntax(message: string) {
  return new FormulaError("FORMULA_SYNTAX", message)
}

export interface ParsedFormula {
  /** The names the formula uses; each must be a parameter of the calculator. */
  names: string[]
  /** The value for the given answers; it may be infinite or not a number (a division by zero). */
  evaluate: (values: Record<string, number>) => number
}

/** Reads a formula; throws `FormulaError` when it is not one. */
export function parseFormula(text: string): ParsedFormula {
  const parser = new Parser(text)
  const evaluate = parser.parseAll()
  return { names: [...parser.names], evaluate }
}

/**
 * What the visitor has answered: the value of a slider, or the place (from 0) of the chosen option of a choice.
 * Keys are the ids of the parameters.
 */
export type Answers = Record<string, number>

/** The answers at first: the default value of each slider and the default option of each choice. */
export function initialAnswers(calculator: Calculator): Answers {
  return Object.fromEntries(
    calculator.parameters.map((parameter) => [parameter.id, parameter.kind === "SLIDER" ? (parameter.defaultValue ?? 0) : (parameter.defaultOption ?? 0)]),
  )
}

/** The answers as the numbers the formula works with: a slider as it stands, a choice as the `value` of the chosen option. */
export function valuesOf(calculator: Calculator, answers: Answers): Record<string, number> {
  return Object.fromEntries(
    calculator.parameters.map((parameter) => {
      const answer = answers[parameter.id] ?? 0
      return [parameter.id, parameter.kind === "SLIDER" ? answer : (parameter.options?.[answer]?.value ?? 0)]
    }),
  )
}

/** The price in whole units of the currency, half up; `null` when the formula does not give a usable number. */
export function priceOf(calculator: Calculator, answers: Answers): number | null {
  try {
    const value = parseFormula(calculator.formula).evaluate(valuesOf(calculator, answers))
    return Number.isFinite(value) && value >= 0 ? Math.floor(value + 0.5) : null
  } catch {
    return null
  }
}

/** A whole amount in the currency: `11 250 ₽`. */
export function formatWhole(amount: number, currency: string): string {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
}

/** The answer of a parameter as the visitor reads it: the number with its unit, or the label of the chosen option. */
export function answerText(parameter: CalculatorParameter, answers: Answers): string {
  const answer = answers[parameter.id] ?? 0
  if (parameter.kind === "SLIDER") return `${answer}${parameter.unit ? ` ${parameter.unit}` : ""}`
  return parameter.options?.[answer]?.label ?? ""
}

/** The message that goes with a visitor's question to the creator: what they chose and the price it gave. */
export function summaryOf(calculator: Calculator, answers: Answers): string {
  const lines = calculator.parameters.map((parameter) => `${parameter.label}: ${answerText(parameter, answers)}`)
  const price = priceOf(calculator, answers)
  const total = price === null ? [] : [`Примерная стоимость: ${formatWhole(price, calculator.currency)}`]
  return ["Здравствуйте! Прикинул стоимость в калькуляторе:", ...lines, ...total].join("\n")
}
