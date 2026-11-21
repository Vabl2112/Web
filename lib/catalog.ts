import type { components } from "@/lib/api/schema"
import { firstOf } from "@/lib/search-params"

type Schemas = components["schemas"]
export type ListingType = Schemas["ListingType"]
export type Category = Schemas["Category"]
export type City = Schemas["City"]
export type CreatorSummary = Schemas["CreatorSummary"]
export type CreatorProfile = Schemas["CreatorProfile"]
export type ListingSummary = Schemas["ListingSummary"]
export type Listing = Schemas["Listing"]
export type PortfolioItem = Schemas["PortfolioItem"]
export type GalleryItem = Schemas["GalleryItem"]
export type Rating = Schemas["Rating"]
export type Feedback = Schemas["Feedback"]
export type MyFeedback = Schemas["MyFeedback"]
export type CreatorSort = Schemas["CreatorSort"]

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
  cityId?: string
  /** The name of the chosen city, only to show it in the chip of the filter (the API filters by `cityId`). */
  cityName?: string
  q?: string
  /** The order: absent is the newest first; the masters know `RATING`, the services and goods all three (ADR 0022). */
  sort?: CatalogSort
  /** How the services and goods are shown: absent is the grid of cards, `list` one row per listing (the toggle of the first web). */
  view?: "list"
  /** The bounds of the starting price of services and goods, in whole roubles (the API takes kopecks). */
  priceMin?: number
  priceMax?: number
  /** Only ready products in stock. */
  inStock?: true
  /** Only listings of masters with the mark "Проверен". */
  verified?: true
}

export type CatalogSort = "RATING" | "PRICE_ASC" | "PRICE_DESC"
const SORTS: readonly CatalogSort[] = ["RATING", "PRICE_ASC", "PRICE_DESC"]
/** The highest bound of a price in the address: a billion roubles, far above any price and inside the kopecks of an `int64`. */
const MAX_PRICE_RUBLES = 1_000_000_000

/** A price bound from the address: whole roubles, digits only. */
function priceOf(value: string | undefined): number | undefined {
  if (value === undefined || !/^\d{1,10}$/.test(value)) return undefined
  const rubles = Number(value)
  return rubles <= MAX_PRICE_RUBLES ? rubles : undefined
}

/** The order of the list of masters: only the rating is theirs, a price order of the address of goods means the newest. */
export function creatorSortOf(query: CatalogQuery): CreatorSort | undefined {
  return query.sort === "RATING" ? "RATING" : undefined
}

const ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_SEARCH_LENGTH = 100
const MAX_CITY_NAME_LENGTH = 120

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
  const cityId = idOf(firstOf(params.cityId))
  if (cityId !== undefined) {
    query.cityId = cityId
    const cityName = firstOf(params.cityName)?.trim().slice(0, MAX_CITY_NAME_LENGTH)
    if (cityName) query.cityName = cityName
  }
  const q = firstOf(params.q)?.trim().slice(0, MAX_SEARCH_LENGTH)
  if (q) query.q = q
  const sort = SORTS.find((candidate) => candidate === firstOf(params.sort))
  if (sort !== undefined) query.sort = sort
  if (firstOf(params.view) === "list") query.view = "list"
  const priceMin = priceOf(firstOf(params.priceMin))
  if (priceMin !== undefined) query.priceMin = priceMin
  const priceMax = priceOf(firstOf(params.priceMax))
  // A range turned upside down is no range: the API would refuse it, so the upper bound is dropped.
  if (priceMax !== undefined && (priceMin === undefined || priceMax >= priceMin)) query.priceMax = priceMax
  if (firstOf(params.inStock) === "true") query.inStock = true
  if (firstOf(params.verified) === "true") query.verified = true
  return query
}

const HREF_KEYS = [
  "categoryId",
  "subcategoryId",
  "type",
  "cityId",
  "cityName",
  "q",
  "priceMin",
  "priceMax",
  "inStock",
  "verified",
  "sort",
  "view",
] as const

/** The address of a catalog page with the given filters; absent and empty ones are left out, so the same filters make the same address. */
export function catalogHref(path: string, query: CatalogQuery): string {
  const search = new URLSearchParams()
  for (const key of HREF_KEYS) {
    const value = query[key]
    if (value !== undefined && value !== "") search.set(key, String(value))
  }
  const text = search.toString()
  return text === "" ? path : `${path}?${text}`
}

/** The query of `GET /v1/listings` for the filters of the address: the page on the server and "Показать ещё" in the browser ask the same. */
export function listingsApiQuery(query: CatalogQuery) {
  return {
    categoryId: query.categoryId,
    subcategoryId: query.subcategoryId,
    type: query.type ? [query.type] : undefined,
    cityId: query.cityId,
    q: query.q,
    priceMin: query.priceMin === undefined ? undefined : query.priceMin * 100,
    priceMax: query.priceMax === undefined ? undefined : query.priceMax * 100,
    inStock: query.inStock,
    verified: query.verified,
    sort: query.sort,
  }
}

/** How many of the filters that sit in the panel "Фильтры" of a phone are set (the search box stays outside it, so it is not counted). */
export function filterCount(query: CatalogQuery): number {
  return (["categoryId", "subcategoryId", "type", "cityId", "sort"] as const).filter((key) => query[key] !== undefined).length
}
