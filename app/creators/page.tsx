import type { Metadata } from "next"
import { CategoryChips, SearchForm } from "@/components/catalog/filters"
import { CreatorList } from "@/components/catalog/creator-list"
import { PageShell } from "@/components/catalog/page-shell"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Создатели — EGG" }

export default async function CreatorsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseCatalogQuery(await searchParams)
  const [categories, page] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(serverApi.GET("/v1/creators", { params: { query: { categoryId: query.categoryId, q: query.q } } })),
  ])
  return (
    <PageShell title="Создатели" description="Витрины людей, которые делают вещи и оказывают услуги.">
      <SearchForm action="/creators" query={query} placeholder="Имя, занятие или тег" />
      <CategoryChips categories={categories.items} basePath="/creators" query={query} />
      <CreatorList key={catalogHref("/creators", query)} initial={page} query={query} />
    </PageShell>
  )
}
