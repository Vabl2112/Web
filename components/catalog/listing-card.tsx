import type { ReactNode } from "react"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { EggImage } from "@/components/egg-image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { initialsOf } from "@/lib/auth/initials"
import { LISTING_TYPE_LABELS, type ListingSummary } from "@/lib/catalog"
import { formatPriceFrom } from "@/lib/format"

interface ListingCardProps {
  listing: ListingSummary
  /** The maker (an avatar and the name, a link to the showcase); off where the list is the showcase of that maker. */
  showMaker?: boolean
  /** The button "Написать"; the list passes it, since it needs the session. */
  action?: ReactNode
}

function placeOf(listing: ListingSummary): string {
  return [listing.city?.name, listing.deliveryAvailable ? "доставка" : null].filter(Boolean).join(" · ")
}

function MakerLink({ listing, className }: { listing: ListingSummary; className: string }) {
  return (
    <Link href={`/creators/${listing.creator.id}`} className={className}>
      <Avatar className="size-6">
        <AvatarFallback className="text-[10px]">{initialsOf(listing.creator.displayName)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-sm text-muted-foreground">{listing.creator.displayName}</span>
    </Link>
  )
}

/**
 * A service as the card of the services of the first prototype: the title and the price on one line, what it is under them, then a line
 * and the maker with the button. It has no photo, and it is two columns wide in the grid of the list.
 */
function ServiceCard({ listing, showMaker = true, action }: ListingCardProps) {
  const href = `/listings/${listing.id}`
  const place = placeOf(listing)
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-lg sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">
              <Link href={href} className="transition-colors hover:text-foreground/80">
                {listing.title}
              </Link>
            </h3>
            <Badge variant="outline">{LISTING_TYPE_LABELS[listing.type]}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{listing.category.name}</p>
          {place ? (
            <p className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin aria-hidden className="size-4" />
              {place}
            </p>
          ) : null}
        </div>
        <p className="text-xl font-bold text-foreground sm:text-right">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</p>
      </div>
      {showMaker || action ? (
        <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          {showMaker ? <MakerLink listing={listing} className="flex items-center gap-3 transition-opacity hover:opacity-80" /> : <span />}
          {action}
        </div>
      ) : null}
    </article>
  )
}

/**
 * A product in a list, as the product card of the first prototype: the photo (the type where the prototype puts its discount), the
 * title, the price, the maker and the button to write.
 */
function ProductCard({ listing, showMaker = true, action }: ListingCardProps) {
  const href = `/listings/${listing.id}`
  const place = placeOf(listing)
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link href={href} tabIndex={-1} aria-hidden className="block size-full">
          {listing.photo ? (
            <EggImage
              image={listing.photo}
              alt=""
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : null}
        </Link>
        <Badge variant="secondary" className="pointer-events-none absolute top-3 left-3">
          {LISTING_TYPE_LABELS[listing.type]}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold text-foreground">
          <Link href={href} className="transition-colors hover:text-foreground/80">
            {listing.title}
          </Link>
        </h3>
        <p className="mt-3 text-xl font-bold text-foreground">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</p>
        {place ? <p className="mt-1 text-xs text-muted-foreground">{place}</p> : null}
        {showMaker ? <MakerLink listing={listing} className="mt-3 flex items-center gap-2 transition-opacity hover:opacity-80" /> : null}
        {action ? <div className="mt-4 flex flex-1 items-end">{action}</div> : null}
      </div>
    </article>
  )
}

/** A listing in a list: a service as the service card of the first prototype, everything else as its product card. */
export function ListingCard(props: ListingCardProps) {
  return props.listing.type === "SERVICE" ? <ServiceCard {...props} /> : <ProductCard {...props} />
}
