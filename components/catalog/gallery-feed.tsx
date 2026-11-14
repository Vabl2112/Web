import { CategoryChips } from "@/components/catalog/filters"
import { GalleryList } from "@/components/catalog/gallery-list"
import { PageShell } from "@/components/catalog/page-shell"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"

interface GalleryFeedProps {
  /** The page that shows the feed: the filter links point back to it. */
  basePath: string
  searchParams: SearchParams
  title: string
  description: string
}

/** The feed of works as a board of pictures with the filter of categories on top; the front page and `/gallery` show the same one. */
export async function GalleryFeed({ basePath, searchParams, title, description }: GalleryFeedProps) {
  const query = parseCatalogQuery(await searchParams)
  const [categories, page] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(serverApi.GET("/v1/gallery", { params: { query: { categoryId: query.categoryId, subcategoryId: query.subcategoryId } } })),
  ])
  return (
    <PageShell title={title} description={description}>
      <CategoryChips categories={categories.items} basePath={basePath} query={query} withSubcategories />
      <GalleryList key={catalogHref(basePath, query)} initial={page} query={query} />
    </PageShell>
  )
}
