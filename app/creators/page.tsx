import type { Metadata } from "next"
import { CityFilter } from "@/components/catalog/city-filter"
import { CreatorList } from "@/components/catalog/creator-list"
import { FilterPanel } from "@/components/catalog/filter-panel"
import { CategoryChips } from "@/components/catalog/filters"
import { LiveSearch } from "@/components/catalog/live-search"
import { PageShell } from "@/components/catalog/page-shell"
import { SortSelect } from "@/components/catalog/sort-select"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, filterCount, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Мастера — EGG" }

export default async function CreatorsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseCatalogQuery(await searchParams)
  const [categories, page] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(serverApi.GET("/v1/creators", { params: { query: { categoryId: query.categoryId, cityId: query.cityId, q: query.q, sort: query.sort } } })),
  ])
  return (
    <PageShell title="Мастера" description="Найдите своего мастера: смотрите работы и пишите напрямую.">
      {/* As the list of masters of the first prototype: the search and the order in one row, the categories as small badges under it. The
          city is chosen with the button of the header; on a phone, where that button is hidden, it is in the sheet of the filters. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LiveSearch basePath="/creators" query={query} placeholder="Имя, занятие или тег" />
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <SortSelect basePath="/creators" query={query} />
          </div>
          <FilterPanel active={filterCount(query)}>
            <SortSelect basePath="/creators" query={query} className="w-full" />
            <CategoryChips size="badge" categories={categories.items} basePath="/creators" query={query} />
            <CityFilter basePath="/creators" query={query} />
          </FilterPanel>
        </div>
      </div>
      <div className="hidden sm:block">
        <CategoryChips size="badge" categories={categories.items} basePath="/creators" query={query} />
      </div>
      <CreatorList key={catalogHref("/creators", query)} initial={page} query={query} />
    </PageShell>
  )
}
