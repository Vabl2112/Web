import { describe, expect, it } from "vitest"
import { catalogHref, creatorSortOf, filterCount, listingsApiQuery, parseCatalogQuery } from "./catalog"

const CATEGORY = "0192f1c6-1111-7000-8000-000000000001"
const SUBCATEGORY = "0192f1c6-1111-7000-8000-000000000011"
const CITY = "0192f1c6-2222-7000-8000-000000000002"

describe("parseCatalogQuery", () => {
  it("reads the filters of the address", () => {
    expect(parseCatalogQuery({ categoryId: CATEGORY, subcategoryId: SUBCATEGORY, type: "SERVICE", q: "  кружка " })).toEqual({
      categoryId: CATEGORY,
      subcategoryId: SUBCATEGORY,
      type: "SERVICE",
      q: "кружка",
    })
  })

  it("drops a value that is not valid, so the API never gets it", () => {
    expect(parseCatalogQuery({ categoryId: "not-an-id", type: "TATTOO", q: "   " })).toEqual({})
  })

  it("reads a city, and its name only together with a valid id", () => {
    expect(parseCatalogQuery({ cityId: CITY, cityName: " Казань " })).toEqual({ cityId: CITY, cityName: "Казань" })
    expect(parseCatalogQuery({ cityId: "nonsense", cityName: "Казань" })).toEqual({})
    expect(parseCatalogQuery({ cityName: "Казань" })).toEqual({})
  })

  it("reads the order of the masters: only RATING is one, the newest first needs no word", () => {
    expect(parseCatalogQuery({ sort: "RATING" })).toEqual({ sort: "RATING" })
    expect(parseCatalogQuery({ sort: "NEWEST" })).toEqual({})
    expect(parseCatalogQuery({ sort: "best" })).toEqual({})
  })

  it("keeps a subcategory only together with its category", () => {
    expect(parseCatalogQuery({ subcategoryId: SUBCATEGORY })).toEqual({})
  })

  it("takes the first of a repeated parameter and cuts a long search to the limit of the contract", () => {
    expect(parseCatalogQuery({ type: ["MADE_TO_ORDER", "SERVICE"] }).type).toBe("MADE_TO_ORDER")
    expect(parseCatalogQuery({ q: "я".repeat(300) }).q).toHaveLength(100)
  })

  it("reads the price, the stock, the mark and the orders of services and goods, and drops what is not valid", () => {
    expect(parseCatalogQuery({ priceMin: "1000", priceMax: "5000", inStock: "true", verified: "true", sort: "PRICE_DESC" })).toEqual({
      priceMin: 1000,
      priceMax: 5000,
      inStock: true,
      verified: true,
      sort: "PRICE_DESC",
    })
    expect(parseCatalogQuery({ priceMin: "-5", priceMax: "1,5", inStock: "1", sort: "CHEAPEST" })).toEqual({})
    // A range turned upside down keeps its lower bound only: the API would refuse it.
    expect(parseCatalogQuery({ priceMin: "5000", priceMax: "1000" })).toEqual({ priceMin: 5000 })
    expect(parseCatalogQuery({ priceMin: "99999999999" })).toEqual({})
  })

  it("gives the masters only the order they know", () => {
    expect(creatorSortOf(parseCatalogQuery({ sort: "RATING" }))).toBe("RATING")
    expect(creatorSortOf(parseCatalogQuery({ sort: "PRICE_ASC" }))).toBeUndefined()
  })
})

describe("listingsApiQuery", () => {
  it("asks the API in kopecks and with the type as a list", () => {
    expect(listingsApiQuery({ type: "SERVICE", priceMin: 1000, priceMax: 2500, inStock: true, sort: "RATING" })).toMatchObject({
      type: ["SERVICE"],
      priceMin: 100000,
      priceMax: 250000,
      inStock: true,
      sort: "RATING",
    })
  })
})

describe("catalogHref", () => {
  it("is the plain path without filters", () => {
    expect(catalogHref("/creators", {})).toBe("/creators")
    expect(catalogHref("/creators", { q: "", categoryId: undefined })).toBe("/creators")
  })

  it("puts the filters in a fixed order, escaped", () => {
    expect(catalogHref("/listings", { q: "чашка ручной работы", type: "READY_PRODUCT", categoryId: CATEGORY })).toBe(
      `/listings?categoryId=${CATEGORY}&type=READY_PRODUCT&q=%D1%87%D0%B0%D1%88%D0%BA%D0%B0+%D1%80%D1%83%D1%87%D0%BD%D0%BE%D0%B9+%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D1%8B`,
    )
  })

  it("keeps the city in the address with its name", () => {
    expect(catalogHref("/creators", { cityId: CITY, cityName: "Казань" })).toBe(
      `/creators?cityId=${CITY}&cityName=%D0%9A%D0%B0%D0%B7%D0%B0%D0%BD%D1%8C`,
    )
  })

  it("makes the address of a link that removes a filter", () => {
    expect(catalogHref("/gallery", { categoryId: CATEGORY, subcategoryId: undefined })).toBe(`/gallery?categoryId=${CATEGORY}`)
  })
})

describe("filterCount", () => {
  it("counts the filters of the panel, not the search or the name of the city", () => {
    expect(filterCount({})).toBe(0)
    expect(filterCount({ q: "кружка" })).toBe(0)
    expect(filterCount({ categoryId: CATEGORY, subcategoryId: SUBCATEGORY })).toBe(2)
    expect(filterCount({ type: "SERVICE", cityId: CITY, cityName: "Казань", sort: "RATING", q: "x" })).toBe(3)
  })
})
