"use client"

import { EmptyState, MoreButton } from "@/components/catalog/more-button"
import { MasonryGrid } from "@/components/catalog/masonry-grid"
import { api } from "@/lib/api/client"
import { type Page, unwrap } from "@/lib/api/hooks"
import type { CatalogQuery, GalleryItem, PortfolioItem } from "@/lib/catalog"
import { useMore } from "@/lib/use-more"

/** The works of the gallery: every tile leads to the showcase of its creator (AC-04). */
export function GalleryList({ initial, query }: { initial: Page<GalleryItem>; query: CatalogQuery }) {
  const { items, hasMore, loading, failure, loadMore } = useMore(initial, (cursor) =>
    unwrap(api.GET("/v1/gallery", { params: { query: { categoryId: query.categoryId, subcategoryId: query.subcategoryId, cursor } } })),
  )
  if (items.length === 0) return <EmptyState>В этой категории пока нет работ.</EmptyState>
  return (
    <div className="flex flex-col gap-6">
      <MasonryGrid tiles={items.map((item) => ({ id: item.id, image: item.image, title: item.title, href: `/creators/${item.creatorId}` }))} />
      <MoreButton hasMore={hasMore} loading={loading} failure={failure} onMore={loadMore} />
    </div>
  )
}

/** The works of one showcase, in the order the creator chose. A tile is only a picture: the visitor is already on the showcase. */
export function PortfolioList({ initial, creatorId }: { initial: Page<PortfolioItem>; creatorId: string }) {
  const { items, hasMore, loading, failure, loadMore } = useMore(initial, (cursor) =>
    unwrap(api.GET("/v1/creators/{id}/portfolio-items", { params: { path: { id: creatorId }, query: { cursor } } })),
  )
  return (
    <div className="flex flex-col gap-6">
      <MasonryGrid tiles={items.map((item) => ({ id: item.id, image: item.image, title: item.title }))} />
      <MoreButton hasMore={hasMore} loading={loading} failure={failure} onMore={loadMore} />
    </div>
  )
}
