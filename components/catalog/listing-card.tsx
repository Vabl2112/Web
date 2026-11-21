import type { ReactNode } from "react"
import Link from "next/link"
import { BadgeCheck, Hammer, MapPin, Package, Sparkles, type LucideIcon } from "lucide-react"
import { RatingCompact } from "@/components/catalog/rating-stars"
import { EggImage } from "@/components/egg-image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { initialsOf } from "@/lib/auth/initials"
import { LISTING_TYPE_LABELS, type ListingSummary, type ListingType } from "@/lib/catalog"
import { formatPriceFrom } from "@/lib/format"
import { cn } from "@/lib/utils"

interface ListingCardProps {
  listing: ListingSummary
  /** The maker (an avatar and the name, a link to the showcase); off where the list is the showcase of that maker. */
  showMaker?: boolean
  /** The button "Написать мастеру"; the list passes it, since it needs the session. */
  action?: ReactNode
  /** `list` is the row of the list view of the first web; the grid card otherwise. */
  view?: "grid" | "list"
}

/** What stands in place of the photo of a listing that has none: the sign of its type. */
const TYPE_ICONS: Record<ListingType, LucideIcon> = { SERVICE: Sparkles, READY_PRODUCT: Package, MADE_TO_ORDER: Hammer }

function placeOf(listing: ListingSummary): string {
  return [listing.city?.name, listing.deliveryAvailable ? "доставка" : null].filter(Boolean).join(" · ")
}

function Photo({ listing, sizes, className }: { listing: ListingSummary; sizes: string; className?: string }) {
  const Icon = TYPE_ICONS[listing.type]
  return (
    <div className={cn("relative aspect-square shrink-0 overflow-hidden bg-muted", className)}>
      <Link href={`/listings/${listing.id}`} tabIndex={-1} aria-hidden className="flex size-full items-center justify-center">
        {listing.photo ? (
          <EggImage image={listing.photo} alt="" sizes={sizes} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <Icon aria-hidden className="size-10 text-muted-foreground/50" />
        )}
      </Link>
      <Badge variant="secondary" className="pointer-events-none absolute top-3 left-3">
        {LISTING_TYPE_LABELS[listing.type]}
      </Badge>
    </div>
  )
}

function Title({ listing, className }: { listing: ListingSummary; className?: string }) {
  return (
    <h3 className={cn("line-clamp-2 leading-snug font-semibold text-foreground", className)}>
      <Link href={`/listings/${listing.id}`} className="transition-colors hover:text-foreground/80">
        {listing.title}
      </Link>
    </h3>
  )
}

/**
 * The rating of the maker, as the first web put it under the title (one amber star, the average and the count), and the mark "Проверен";
 * nothing while the maker has neither.
 */
function MakerFacts({ listing }: { listing: ListingSummary }) {
  if (!listing.creatorRating && !listing.creatorVerified) return null
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <RatingCompact rating={listing.creatorRating} />
      {listing.creatorVerified ? (
        <span className="flex items-center gap-1 text-green-700">
          <BadgeCheck aria-hidden className="size-4" />
          Проверен
        </span>
      ) : null}
    </div>
  )
}

/** The category (and the subcategory) and where the listing is: the city, the delivery, a ready product out of stock. */
function Details({ listing }: { listing: ListingSummary }) {
  const place = placeOf(listing)
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
      <span>{listing.subcategory ? `${listing.category.name} · ${listing.subcategory.name}` : listing.category.name}</span>
      {listing.inStock === false ? <span className="text-amber-700">Нет в наличии</span> : null}
      {place ? (
        <span className="flex items-center gap-1">
          <MapPin aria-hidden className="size-3.5" />
          {place}
        </span>
      ) : null}
    </p>
  )
}

function Price({ listing }: { listing: ListingSummary }) {
  return <p className="text-xl font-bold text-foreground">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</p>
}

function Maker({ listing, className }: { listing: ListingSummary; className?: string }) {
  return (
    <Link href={`/creators/${listing.creator.id}`} className={cn("flex items-center gap-2 transition-opacity hover:opacity-80", className)}>
      <Avatar className="size-6">
        <AvatarFallback className="text-[10px]">{initialsOf(listing.creator.displayName)}</AvatarFallback>
      </Avatar>
      <span className="min-w-0 truncate text-sm text-muted-foreground">{listing.creator.displayName}</span>
    </Link>
  )
}

/** The row of the list view of the first web: the photo on the left, the text in the middle, the price and the button at the bottom. */
function ListingRow({ listing, showMaker = true, action }: ListingCardProps) {
  return (
    <article className="group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20 hover:shadow-lg sm:gap-6">
      <Photo listing={listing} sizes="160px" className="w-28 rounded-xl sm:w-40" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Title listing={listing} />
        <MakerFacts listing={listing} />
        <Details listing={listing} />
        {showMaker ? <Maker listing={listing} className="mt-2" /> : null}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-3">
          <Price listing={listing} />
          {action}
        </div>
      </div>
    </article>
  )
}

/**
 * A listing as the product card of the first web: the square photo with the type on it (where the first web put its discount), the title,
 * the category and the place, the price, the maker and the button to write. Services are cards like the rest, so the grid stays even;
 * a listing with no photo shows the sign of its type.
 */
export function ListingCard(props: ListingCardProps) {
  const { listing, showMaker = true, action, view = "grid" } = props
  if (view === "list") return <ListingRow {...props} />
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-foreground/20 hover:shadow-lg">
      <Photo listing={listing} sizes="(min-width: 1024px) 25vw, 50vw" />
      <div className="flex flex-1 flex-col p-4">
        <Title listing={listing} className="min-h-[2.75rem]" />
        <MakerFacts listing={listing} />
        <Details listing={listing} />
        <div className="mt-3">
          <Price listing={listing} />
        </div>
        {showMaker ? <Maker listing={listing} className="mt-3" /> : null}
        {action ? <div className="mt-4 flex flex-1 items-end [&>*]:w-full">{action}</div> : null}
      </div>
    </article>
  )
}
