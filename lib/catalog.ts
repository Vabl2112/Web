import type { components } from "@/lib/api/schema"
import { firstOf } from "@/lib/search-params"

type Schemas = components["schemas"]
export type ListingType = Schemas["ListingType"]
export type Category = Schemas["Category"]
export type CreatorSummary = Schemas["CreatorSummary"]
export type CreatorProfile = Schemas["CreatorProfile"]
export type ListingSummary = Schemas["ListingSummary"]
export type Listing = Schemas["Listing"]
export type PortfolioItem = Schemas["PortfolioItem"]
export type GalleryItem = Schemas["GalleryItem"]

export const LISTING_TYPES: readonly ListingType[] = ["SERVICE", "READY_PRODUCT", "MADE_TO_ORDER"]

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SERVICE: "Услуга",
  READY_PRODUCT: "Готовый товар",
  MADE_TO_ORDER: "На заказ",
}

/** What the catalog pages filter by; every value comes from the address of the page, so each filter is a link and works without scripts. */
export interface CatalogQuery {
  categoryId?: string
  subcategoryId?: string
  type?: ListingType
  q?: string
}

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SEARCH_LENGTH = 100

function idOf(value: string | undefined): string | undefined {
  return value !== undefined && ID_PATTERN.test(value) ? value : undefined
}

/** The filters from the query of a page. A value that is not valid is dropped, so a hand-made address never reaches the API as an error. */
export function parseCatalogQuery(params: Record<string, string | string[] | undefined>): CatalogQuery {
  const query: CatalogQuery = {}
  const categoryId = idOf(firstOf(params.categoryId))
  if (categoryId !== undefined) query.categoryId = categoryId
  const subcategoryId = categoryId === undefined ? undefined : idOf(firstOf(params.subcategoryId))
  if (subcategoryId !== undefined) query.subcategoryId = subcategoryId
  const type = LISTING_TYPES.find((candidate) => candidate === firstOf(params.type))
  if (type !== undefined) query.type = type
  const q = firstOf(params.q)?.trim().slice(0, MAX_SEARCH_LENGTH)
  if (q) query.q = q
  return query
}

/** The address of a catalog page with the given filters; absent and empty ones are left out, so the same filters make the same address. */
export function catalogHref(path: string, query: CatalogQuery): string {
  const search = new URLSearchParams()
  for (const key of ["categoryId", "subcategoryId", "type", "q"] as const) {
    const value = query[key]
    if (value !== undefined && value !== "") search.set(key, value)
  }
  const text = search.toString()
  return text === "" ? path : `${path}?${text}`
}
