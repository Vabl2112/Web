import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Category } from "@/lib/catalog"
import { ActiveFilters, ListingFilters, VISIBLE_CATEGORIES, activeChipsOf, listingFilterCount, priceRangeText } from "./listing-filters"

// The search of a city reads the router; the filters are checked without it.
vi.mock("@/components/catalog/city-filter", () => ({ CityFilter: () => <div>CITY</div> }))

const CERAMICS: Category = { id: "0192f1c6-2222-7000-8000-000000000001", slug: "ceramics", name: "Керамика", children: [] }
const JEWELRY: Category = { id: "0192f1c6-2222-7000-8000-000000000002", slug: "jewelry", name: "Украшения", children: [] }
const CITY = "0192f1c6-4444-7000-8000-000000000001"
const MUGS = { id: "0192f1c6-2222-7000-8000-000000000011", slug: "mugs", name: "Посуда" }
const VASES = { id: "0192f1c6-2222-7000-8000-000000000012", slug: "vases", name: "Вазы" }
const WITH_CHILDREN = { ...CERAMICS, children: [MUGS, VASES] } as Category
const decode = (html: string) => html.replaceAll("&amp;", "&")

describe("ListingFilters", () => {
  it("has the type and the categories as links, a chosen one leading to the address without it", () => {
    const html = decode(renderToStaticMarkup(<ListingFilters categories={[CERAMICS, JEWELRY]} query={{ type: "SERVICE", categoryId: CERAMICS.id }} />))

    expect(html).toContain(">Тип<")
    expect(html).toContain("Готовые товары")
    expect(html).toContain(`href="/listings?categoryId=${CERAMICS.id}&type=READY_PRODUCT"`)
    // The chosen type and category take themselves off.
    expect(html).toContain(`href="/listings?categoryId=${CERAMICS.id}"`)
    expect(html).toContain(`href="/listings?type=SERVICE"`)
    expect(html).toContain(`href="/listings?categoryId=${JEWELRY.id}&type=SERVICE"`)
    expect(html).toContain("Сбросить фильтры (2)")
    expect(html).not.toContain("CITY")
  })

  it("has no reset while nothing is set, and the city only in the sheet of a phone", () => {
    const desktop = renderToStaticMarkup(<ListingFilters categories={[CERAMICS]} query={{}} />)
    const sheet = renderToStaticMarkup(<ListingFilters categories={[CERAMICS]} query={{}} withCity />)

    expect(desktop).not.toContain("Сбросить")
    expect(sheet).toContain("CITY")
  })

  it("folds the categories after the first few, and keeps them open when the chosen one is among them", () => {
    const many: Category[] = Array.from({ length: VISIBLE_CATEGORIES + 3 }, (_, i) => ({
      ...CERAMICS,
      id: `0192f1c6-2222-7000-8000-${String(i + 10).padStart(12, "0")}`,
      name: `Категория ${i + 1}`,
    }))
    const folded = renderToStaticMarkup(<ListingFilters categories={many} query={{}} />)
    const opened = renderToStaticMarkup(<ListingFilters categories={many} query={{ categoryId: many[VISIBLE_CATEGORIES + 1].id }} />)

    expect(folded).toContain("Показать ещё 3")
    expect(folded).toMatch(/<details class="group\/more[^"]*">/)
    expect(opened).toMatch(/<details open="" class="group\/more/)
  })

  it("keeps the view when the filters are reset", () => {
    const html = renderToStaticMarkup(<ListingFilters categories={[CERAMICS]} query={{ q: "кружка", view: "list" }} />)

    expect(html).toContain('href="/listings?view=list"')
  })
})

describe("the chips of what is set", () => {
  it("names every filter that is set and leads to the address without it", () => {
    const query = { type: "MADE_TO_ORDER" as const, categoryId: CERAMICS.id, cityId: CITY, cityName: "Казань", q: "ваза" }

    expect(activeChipsOf([CERAMICS], query).map((chip) => chip.label)).toEqual(["На заказ", "Керамика", "Казань", "«ваза»"])
    expect(listingFilterCount(query)).toBe(4)
    const html = decode(renderToStaticMarkup(<ActiveFilters categories={[CERAMICS]} query={query} />))
    expect(html).toContain('aria-label="Убрать фильтр: Казань"')
    expect(html).toContain(`href="/listings?categoryId=${CERAMICS.id}&type=MADE_TO_ORDER&q=`)
    expect(html).toContain("Сбросить все")
  })

  it("shows nothing while nothing is set", () => {
    expect(renderToStaticMarkup(<ActiveFilters categories={[CERAMICS]} query={{}} />)).toBe("")
  })

  it("names the subcategory, the price, the stock and the mark, and counts the price as one filter", () => {
    const query = { categoryId: WITH_CHILDREN.id, subcategoryId: MUGS.id, priceMin: 1000, priceMax: 5000, inStock: true as const, verified: true as const }

    // Russian numbers are grouped with a no-break space; the words are compared with plain spaces.
    expect(activeChipsOf([WITH_CHILDREN], query).map((chip) => chip.label.replace(/\s/g, " "))).toEqual([
      "Керамика",
      "Посуда",
      "1 000 – 5 000 ₽",
      "В наличии",
      "Проверенные мастера",
    ])
    expect(listingFilterCount(query)).toBe(5)
    expect(priceRangeText(1000, undefined).replace(/\s/g, " ")).toBe("от 1 000 ₽")
    expect(priceRangeText(undefined, 500)).toBe("до 500 ₽")
  })
})

describe("the tree, the price and the extras", () => {
  it("opens the subcategories under the chosen category only, a chosen one taking itself off", () => {
    const closed = decode(renderToStaticMarkup(<ListingFilters categories={[WITH_CHILDREN]} query={{}} />))
    const open = decode(renderToStaticMarkup(<ListingFilters categories={[WITH_CHILDREN]} query={{ categoryId: WITH_CHILDREN.id, subcategoryId: MUGS.id }} />))

    expect(closed).not.toContain("Посуда")
    expect(open).toContain('aria-label="Подкатегории: Керамика"')
    expect(open).toContain(`href="/listings?categoryId=${WITH_CHILDREN.id}"`)
    expect(open).toContain(`href="/listings?categoryId=${WITH_CHILDREN.id}&subcategoryId=${VASES.id}"`)
  })

  it("asks the price in a form that keeps every other filter, and has the stock and the mark as boxes", () => {
    const html = decode(renderToStaticMarkup(<ListingFilters categories={[CERAMICS]} query={{ type: "SERVICE", priceMin: 1000, inStock: true, view: "list" }} />))

    expect(html).toContain('action="/listings"')
    expect(html).toContain('method="get"')
    expect(html).toContain('<input type="hidden" name="type" value="SERVICE"/>')
    expect(html).toContain('<input type="hidden" name="inStock" value="true"/>')
    expect(html).not.toContain('type="hidden" name="priceMin"')
    expect(html).toMatch(/name="priceMin"[^>]*value="1000"/)
    expect(html).toMatch(/role="checkbox" aria-checked="true"[^>]*>[\s\S]*Только в наличии/)
    // The box of the mark adds itself to the filters that are set; the box of the stock, which is on, takes itself off.
    expect(html).toContain('href="/listings?type=SERVICE&priceMin=1000&inStock=true&verified=true&view=list"')
    expect(html).toContain('href="/listings?type=SERVICE&priceMin=1000&view=list"')
  })
})
