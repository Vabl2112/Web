"use client"

import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type CatalogQuery, catalogHref } from "@/lib/catalog"

const NEWEST = "NEWEST"

/** The order of the list of masters as a select, like the one of the first prototype: the newest first (the default) or the best rated (AC-49). */
export function SortSelect({ basePath, query, className }: { basePath: string; query: CatalogQuery; className?: string }) {
  const router = useRouter()
  return (
    <Select
      value={query.sort ?? NEWEST}
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
