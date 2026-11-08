"use client"

import { ListingCard } from "@/components/catalog/listing-card"
import { EmptyState, MoreButton } from "@/components/catalog/more-button"
import { api } from "@/lib/api/client"
import { type Page, unwrap } from "@/lib/api/hooks"
import type { CatalogQuery, ListingSummary } from "@/lib/catalog"
import { useMore } from "@/lib/use-more"

interface ListingListProps {
  initial: Page<ListingSummary>
  /** The filters of `/listings`; ignored for the listings of one showcase. */
  query?: CatalogQuery
  /** When set, the list is the listings of this showcase. */
  creatorId?: string
  emptyText?: string
}

/** The listings of a page, all of the catalog or of one showcase, with "Show more". */
export function ListingList({ initial, query = {}, creatorId, emptyText = "Ничего не нашлось. Попробуйте другой запрос или категорию." }: ListingListProps) {
  const { items, hasMore, loading, failure, loadMore } = useMore(initial, (cursor) =>
    unwrap(
      creatorId === undefined
        ? api.GET("/v1/listings", {
            params: { query: { categoryId: query.categoryId, type: query.type ? [query.type] : undefined, cityId: query.cityId, q: query.q, cursor } },
          })
        : api.GET("/v1/creators/{id}/listings", { params: { path: { id: creatorId }, query: { cursor } } }),
    ),
  )
  if (items.length === 0) return <EmptyState>{emptyText}</EmptyState>
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((listing) => (
          <li key={listing.id}>
            <ListingCard listing={listing} />
          </li>
        ))}
      </ul>
      <MoreButton hasMore={hasMore} loading={loading} failure={failure} onMore={loadMore} />
    </div>
  )
}
