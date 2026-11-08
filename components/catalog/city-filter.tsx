"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CitySearch } from "@/components/catalog/city-search"
import { type CatalogQuery, catalogHref } from "@/lib/catalog"

/**
 * The filter by city of a catalog page: the chosen city as a chip that leads to the address without it, or the search. A pick makes a new
 * address (`cityId` and `cityName` in the query), so the filtered page can be shared like any other.
 */
export function CityFilter({ basePath, query }: { basePath: string; query: CatalogQuery }) {
  const router = useRouter()
  if (query.cityId !== undefined) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-foreground bg-foreground px-4 py-1.5 text-background">Город: {query.cityName ?? "выбран"}</span>
        <Link href={catalogHref(basePath, { ...query, cityId: undefined, cityName: undefined })} className="text-muted-foreground underline underline-offset-4">
          Сбросить
        </Link>
      </div>
    )
  }
  return (
    <div className="max-w-sm">
      <CitySearch
        label="Город"
        onPick={(city) => router.push(catalogHref(basePath, { ...query, cityId: city.id, cityName: city.name }))}
      />
    </div>
  )
}
