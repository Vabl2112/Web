import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { Category } from "@/lib/catalog"
import { ActiveFilters, ListingFilters, VISIBLE_CATEGORIES, activeChipsOf, listingFilterCount } from "./listing-filters"

// The search of a city reads the router; the filters are checked without it.
vi.mock("@/components/catalog/city-filter", () => ({ CityFilter: () => <div>CITY</div> }))

const CERAMICS: Category = { id: "0192f1c6-2222-7000-8000-000000000001", slug: "ceramics", name: "Керамика", children: [] }
const JEWELRY: Category = { id: "0192f1c6-2222-7000-8000-000000000002", slug: "jewelry", name: "Украшения", children: [] }
const CITY = "0192f1c6-4444-7000-8000-000000000001"
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
})
