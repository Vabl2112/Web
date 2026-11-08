import type { Metadata } from "next"
import { CityFilter } from "@/components/catalog/city-filter"
import { CategoryChips, SearchForm, TypeTabs } from "@/components/catalog/filters"
import { ListingList } from "@/components/catalog/listing-list"
import { PageShell } from "@/components/catalog/page-shell"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Позиции — EGG" }

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
    <PageShell title="Позиции" description="Услуги, готовые товары и работы на заказ.">
      <SearchForm action="/listings" query={query} placeholder="Название или описание" />
      <TypeTabs basePath="/listings" query={query} />
      <CategoryChips categories={categories.items} basePath="/listings" query={query} />
      <CityFilter basePath="/listings" query={query} />
      <ListingList key={catalogHref("/listings", query)} initial={page} query={query} />
    </PageShell>
  )
}
