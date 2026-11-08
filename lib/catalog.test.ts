import { describe, expect, it } from "vitest"
import { catalogHref, parseCatalogQuery } from "./catalog"

const CATEGORY = "0192f1c6-1111-7000-8000-000000000001"
const SUBCATEGORY = "0192f1c6-1111-7000-8000-000000000011"

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

  it("keeps a subcategory only together with its category", () => {
    expect(parseCatalogQuery({ subcategoryId: SUBCATEGORY })).toEqual({})
  })

  it("takes the first of a repeated parameter and cuts a long search to the limit of the contract", () => {
    expect(parseCatalogQuery({ type: ["MADE_TO_ORDER", "SERVICE"] }).type).toBe("MADE_TO_ORDER")
    expect(parseCatalogQuery({ q: "я".repeat(300) }).q).toHaveLength(100)
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

  it("makes the address of a link that removes a filter", () => {
    expect(catalogHref("/gallery", { categoryId: CATEGORY, subcategoryId: undefined })).toBe(`/gallery?categoryId=${CATEGORY}`)
  })
})
