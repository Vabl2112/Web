import type { ReactNode } from "react"
import Link from "next/link"
import { EggImage } from "@/components/egg-image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { initialsOf } from "@/lib/auth/initials"
import { LISTING_TYPE_LABELS, type ListingSummary } from "@/lib/catalog"
import { formatPriceFrom } from "@/lib/format"

interface ListingCardProps {
  listing: ListingSummary
  /** The maker under the price (an avatar and the name, a link to the showcase); off where the list is the showcase of that maker. */
  showMaker?: boolean
  /** What stands at the bottom of the card, in practice the button "Написать"; the list passes it, since it needs the session. */
  action?: ReactNode
}

/**
 * A service or a product in a list, as the cards of the first prototype: the photo, the type, the title, the price from (or "by
 * agreement"), the maker and the button to write. Services and goods are one list, so the card is the same for both.
 */
export function ListingCard({ listing, showMaker = true, action }: ListingCardProps) {
  const href = `/listings/${listing.id}`
  const place = [listing.city?.name, listing.deliveryAvailable ? "доставка" : null].filter(Boolean).join(" · ")
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg">
      <Link href={href} tabIndex={-1} aria-hidden className="block aspect-square overflow-hidden bg-muted">
        {listing.photo ? (
          <EggImage
            image={listing.photo}
            alt=""
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Badge variant="outline" className="w-fit">
          {LISTING_TYPE_LABELS[listing.type]}
        </Badge>
        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground">
          <Link href={href} className="transition-colors hover:text-foreground/80">
            {listing.title}
          </Link>
        </h3>
        <p className="mt-3 text-xl font-bold text-foreground">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</p>
        {place ? <p className="mt-1 text-xs text-muted-foreground">{place}</p> : null}
        {showMaker ? (
          <Link href={`/creators/${listing.creator.id}`} className="mt-3 flex items-center gap-2 transition-opacity hover:opacity-80">
            <Avatar className="size-6">
              <AvatarFallback className="text-[10px]">{initialsOf(listing.creator.displayName)}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 truncate text-sm text-muted-foreground">{listing.creator.displayName}</span>
          </Link>
        ) : null}
        {action ? <div className="mt-4 flex flex-1 items-end">{action}</div> : null}
      </div>
    </article>
  )
}
