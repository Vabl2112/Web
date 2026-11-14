import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { Calculator } from "@/lib/calculator"
import { CalculatorView } from "./calculator-card"
import { MasonryGrid } from "./masonry-grid"
import { ShowcaseTabs } from "./showcase-tabs"

const plain = (text: string) => text.replace(/\s/g, " ")
const IMAGE = { width: 1280, height: 960, variants: [{ width: 640, url: "https://media.example.org/m/640.webp" }] }

describe("MasonryGrid caption", () => {
  it("names the author on a tile that has one, with the picture lifting under the pointer", () => {
    const html = renderToStaticMarkup(
      <MasonryGrid tiles={[{ id: "a", image: IMAGE, title: "Ваза", author: { name: "Анна Керамика" }, href: "/creators/42" }]} />,
    )

    expect(html).toContain("Анна Керамика")
    expect(html).not.toContain(">Ваза<")
    expect(html).toContain("group-hover:scale-105")
    expect(html).toContain(">А<")
  })

  it("falls back to the title when there is no author, and has no caption without either", () => {
    const withTitle = renderToStaticMarkup(<MasonryGrid tiles={[{ id: "a", image: IMAGE, title: "Ваза" }]} />)
    const bare = renderToStaticMarkup(<MasonryGrid tiles={[{ id: "a", image: IMAGE }]} />)

    expect(withTitle).toContain(">Ваза<")
    expect(bare).not.toContain("translate-y-full")
  })
})

describe("ShowcaseTabs", () => {
  const tabs = [
    { id: "portfolio", label: "Портфолио", content: <p>работы</p> },
    { id: "listings", label: "Позиции", content: <p>позиции</p> },
  ]

  it("shows the tabs, the first section and the gear that hides sections", () => {
    const html = renderToStaticMarkup(<ShowcaseTabs tabs={tabs} />)

    expect(html).toContain("Портфолио")
    expect(html).toContain("Позиции")
    expect(html).toContain("работы")
    expect(html).not.toContain("позиции")
    expect(html).toContain("Настроить разделы")
  })

  it("has no gear for a single section and nothing at all for none", () => {
    expect(renderToStaticMarkup(<ShowcaseTabs tabs={tabs.slice(0, 1)} />)).not.toContain("Настроить разделы")
    expect(renderToStaticMarkup(<ShowcaseTabs tabs={[]} />)).toBe("")
  })
})

describe("CalculatorView", () => {
  const calculator: Calculator = {
    title: "Рассчитайте стоимость",
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
        ],
        defaultOption: 1,
      },
    ],
  }

  it("shows the questions with what stands at first and the price they give", () => {
    const html = plain(renderToStaticMarkup(<CalculatorView calculator={calculator} />))

    expect(html).toContain("Рассчитайте стоимость")
    expect(html).toContain("Размер")
    expect(html).toContain("15 см")
    expect(html).toContain("Контур")
    expect(html).toContain("≈ 11 250 ₽")
    expect(html).toContain("Примерная стоимость")
  })

  it("has no button to write in the preview of the cabinet", () => {
    expect(renderToStaticMarkup(<CalculatorView calculator={calculator} />)).not.toContain("Написать")
  })

  it("shows a dash instead of a price the formula cannot give", () => {
    const html = renderToStaticMarkup(<CalculatorView calculator={{ ...calculator, formula: "size / 0" }} />)

    expect(html).toContain("—")
    expect(html).not.toContain("≈")
  })

  it("offers a list to pick from when a choice has many options", () => {
    const many = Array.from({ length: 6 }, (_, index) => ({ label: `Вариант ${index}`, value: index }))
    const html = renderToStaticMarkup(
      <CalculatorView
        calculator={{
          ...calculator,
          parameters: [calculator.parameters[0], { id: "complexity", label: "Сложность", kind: "CHOICE", options: many, defaultOption: 0 }],
        }}
      />,
    )

    expect(html).toContain('role="combobox"')
  })
})
