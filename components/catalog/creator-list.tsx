"use client"

import { CreatorCard } from "@/components/catalog/creator-card"
import { EmptyState, MoreButton } from "@/components/catalog/more-button"
import { WriteButton } from "@/components/messaging/write-button"
import { api } from "@/lib/api/client"
import type { Page } from "@/lib/api/hooks"
import { unwrap } from "@/lib/api/hooks"
import type { CatalogQuery, CreatorSummary } from "@/lib/catalog"
import { useMore } from "@/lib/use-more"

/** The showcases of a page: the first page came from the server, "Show more" reads the next ones with the same filters. */
export function CreatorList({ initial, query }: { initial: Page<CreatorSummary>; query: CatalogQuery }) {
  const { items, hasMore, loading, failure, loadMore } = useMore(initial, (cursor) =>
    unwrap(api.GET("/v1/creators", { params: { query: { categoryId: query.categoryId, cityId: query.cityId, q: query.q, cursor } } })),
  )
  if (items.length === 0) return <EmptyState>Ничего не нашлось. Попробуйте другой запрос или категорию.</EmptyState>
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {items.map((creator) => (
          <li key={creator.id}>
            <CreatorCard creator={creator} action={<WriteButton creatorId={creator.id} variant="outline" className="w-full sm:w-auto" />} />
          </li>
        ))}
      </ul>
      <MoreButton hasMore={hasMore} loading={loading} failure={failure} onMore={loadMore} />
    </div>
  )
}
