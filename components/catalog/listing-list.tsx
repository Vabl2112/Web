"use client"

import { MessageSquare } from "lucide-react"
import { ListingCard } from "@/components/catalog/listing-card"
import { EmptyState, MoreButton } from "@/components/catalog/more-button"
import { WriteButton } from "@/components/messaging/write-button"
import { api } from "@/lib/api/client"
import { type Page, unwrap } from "@/lib/api/hooks"
import type { CatalogQuery, ListingSummary } from "@/lib/catalog"
import { useMore } from "@/lib/use-more"
import { cn } from "@/lib/utils"

interface ListingListProps {
  initial: Page<ListingSummary>
  /** The filters of `/listings`; ignored for the listings of one showcase. */
  query?: CatalogQuery
  /** When set, the list is the listings of this showcase. */
  creatorId?: string
  emptyText?: string
  /** The list stands next to the sidebar of the filters (three cards on a row, as in the first web) or takes the whole width (four). */
  withSidebar?: boolean
}

/** The listings of a page, all of the catalog or of one showcase, as a grid of cards or as a list, with "Show more". */
export function ListingList({
  initial,
  query = {},
  creatorId,
  emptyText = "Ничего не нашлось. Попробуйте другой запрос или категорию.",
  withSidebar = false,
}: ListingListProps) {
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
  const view = query.view === "list" ? "list" : "grid"
  return (
    <div className="flex flex-col gap-6">
      <ul className={cn("grid gap-4", view === "list" ? "grid-cols-1" : withSidebar ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4")}>
        {items.map((listing) => (
          <li key={listing.id}>
            <ListingCard
              listing={listing}
              view={view}
              showMaker={creatorId === undefined}
              action={
                <WriteButton
                  creatorId={listing.creator.id}
                  listing={{ id: listing.id, title: listing.title }}
                  label={
                    // A card is narrow on a phone (two on a row): the short word there, the whole one from a tablet up.
                    view === "grid" ? (
                      <>
                        <span className="sm:hidden">Написать</span>
                        <span className="hidden sm:inline">Написать мастеру</span>
                      </>
                    ) : (
                      "Написать мастеру"
                    )
                  }
                  icon={<MessageSquare aria-hidden className="size-4" />}
                />
              }
            />
          </li>
        ))}
      </ul>
      <MoreButton hasMore={hasMore} loading={loading} failure={failure} onMore={loadMore} />
    </div>
  )
}
