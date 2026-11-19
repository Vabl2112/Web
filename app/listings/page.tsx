import type { Metadata } from "next"
import { CityFilter } from "@/components/catalog/city-filter"
import { CategoryChips, SearchForm, TypeTabs } from "@/components/catalog/filters"
import { ListingList } from "@/components/catalog/listing-list"
import { PageShell } from "@/components/catalog/page-shell"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { type ListingType, catalogHref, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"

/** The header of the page follows the type, because "Услуги" and "Товары" of the menu are this page with the type chosen. */
const HEADINGS: Record<ListingType, { title: string; description: string }> = {
  SERVICE: { title: "Услуги", description: "Выберите услугу и напишите мастеру." },
  READY_PRODUCT: { title: "Товары", description: "Готовые вещи мастеров: выберите и напишите продавцу." },
  MADE_TO_ORDER: { title: "Работы на заказ", description: "То, что мастера делают под заказ." },
}
const ALL_TYPES = { title: "Позиции", description: "Услуги, готовые товары и работы на заказ." }

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { type } = parseCatalogQuery(await searchParams)
  return { title: `${(type ? HEADINGS[type] : ALL_TYPES).title} — EGG` }
}

export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseCatalogQuery(await searchParams)
  const heading = query.type ? HEADINGS[query.type] : ALL_TYPES
  const [categories, page] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(
      serverApi.GET("/v1/listings", {
        params: { query: { categoryId: query.categoryId, type: query.type ? [query.type] : undefined, cityId: query.cityId, q: query.q } },
      }),
    ),
  ])
  return (
    <PageShell title={heading.title} description={heading.description}>
      <SearchForm action="/listings" query={query} placeholder="Название или описание" />
      <TypeTabs basePath="/listings" query={query} />
      <CategoryChips categories={categories.items} basePath="/listings" query={query} />
      <CityFilter basePath="/listings" query={query} />
      <ListingList key={catalogHref("/listings", query)} initial={page} query={query} />
    </PageShell>
  )
}
