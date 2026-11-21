import type { Metadata } from "next"
import { CityFilter } from "@/components/catalog/city-filter"
import { FilterPanel } from "@/components/catalog/filter-panel"
import { CategoryChips, TypeTabs } from "@/components/catalog/filters"
import { ListingList } from "@/components/catalog/listing-list"
import { LiveSearch } from "@/components/catalog/live-search"
import { PageShell } from "@/components/catalog/page-shell"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, filterCount, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Услуги и товары — EGG" }

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseCatalogQuery(await searchParams)
  const [categories, page] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(
      serverApi.GET("/v1/listings", {
        params: { query: { categoryId: query.categoryId, type: query.type ? [query.type] : undefined, cityId: query.cityId, q: query.q } },
      }),
    ),
  ])
  return (
    <PageShell title="Услуги и товары" description="Услуги, готовые вещи и работы на заказ: выберите и напишите мастеру.">
      {/* As the pages of services and goods of the first prototype: the pills first, then the search. The city is chosen with the button of
          the header; on a phone, where that button is hidden, it is in the sheet of the filters. */}
      <div className="hidden flex-col gap-4 sm:flex">
        <TypeTabs size="md" basePath="/listings" query={query} />
        <CategoryChips size="md" categories={categories.items} basePath="/listings" query={query} />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <LiveSearch basePath="/listings" query={query} placeholder="Название или описание" />
        <FilterPanel active={filterCount(query)}>
          <TypeTabs size="badge" basePath="/listings" query={query} />
          <CategoryChips size="badge" categories={categories.items} basePath="/listings" query={query} />
          <CityFilter basePath="/listings" query={query} />
        </FilterPanel>
      </div>
      <ListingList key={catalogHref("/listings", query)} initial={page} query={query} />
    </PageShell>
  )
}
