"use client"

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type CatalogQuery, type CatalogSort, catalogHref, creatorSortOf } from "@/lib/catalog"

const NEWEST = "NEWEST"

/** The orders other than the default one; "Сначала новые" is no order in the address. */
const ORDERS: readonly CatalogSort[] = ["PRICE_ASC", "PRICE_DESC", "RATING"]

/** The orders of services and goods, as the select of the first web had them (ADR 0022). */
const LISTING_SORTS: { value: CatalogSort | typeof NEWEST; label: string }[] = [
  { value: NEWEST, label: "Сначала новые" },
  { value: "PRICE_ASC", label: "Сначала дешевле" },
  { value: "PRICE_DESC", label: "Сначала дороже" },
  { value: "RATING", label: "По рейтингу мастера" },
]

/** The order of services and goods; a new order starts the list from its first page, the filters stay. */
export function ListingSortSelect({ query, className }: { query: CatalogQuery; className?: string }) {
  const router = useRouter()
  return (
    <Select
      value={query.sort ?? NEWEST}
      onValueChange={(value) => router.push(catalogHref("/listings", { ...query, sort: ORDERS.find((sort) => sort === value) }))}
    >
      <SelectTrigger className={className ?? "w-48"} aria-label="Порядок">
        <SelectValue placeholder="Сортировка" />
      </SelectTrigger>
      <SelectContent>
        {LISTING_SORTS.map((sort) => (
          <SelectItem key={sort.value} value={sort.value}>
            {sort.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** The order of the list of masters as a select, like the one of the first prototype: the newest first (the default) or the best rated (AC-49). */
export function SortSelect({ basePath, query, className }: { basePath: string; query: CatalogQuery; className?: string }) {
  const router = useRouter()
  return (
    <Select
      value={creatorSortOf(query) ?? NEWEST}
      onValueChange={(value) => router.push(catalogHref(basePath, { ...query, sort: value === "RATING" ? "RATING" : undefined }))}
    >
      <SelectTrigger className={className ?? "w-40"} aria-label="Порядок мастеров">
        <SelectValue placeholder="Сортировка" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NEWEST}>Сначала новые</SelectItem>
        <SelectItem value="RATING">По рейтингу</SelectItem>
      </SelectContent>
    </Select>
  )
}
