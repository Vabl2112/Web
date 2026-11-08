import type { Metadata } from "next"
import { CategoryChips } from "@/components/catalog/filters"
import { GalleryList } from "@/components/catalog/gallery-list"
import { PageShell } from "@/components/catalog/page-shell"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Работы — EGG" }

export default async function GalleryPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseCatalogQuery(await searchParams)
  const [categories, page] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(serverApi.GET("/v1/gallery", { params: { query: { categoryId: query.categoryId, subcategoryId: query.subcategoryId } } })),
  ])
  return (
    <PageShell title="Работы" description="Лента работ из опубликованных витрин. Нажмите на работу, чтобы открыть витрину её автора.">
      <CategoryChips categories={categories.items} basePath="/gallery" query={query} withSubcategories />
      <GalleryList key={catalogHref("/gallery", query)} initial={page} query={query} />
    </PageShell>
  )
}
