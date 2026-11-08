import Link from "next/link"
import { EggImage } from "@/components/egg-image"
import { Badge } from "@/components/ui/badge"
import { LISTING_TYPE_LABELS, type ListingSummary } from "@/lib/catalog"
import { formatPriceFrom } from "@/lib/format"

/** A listing in a list: the photo, the type, the title, whose it is and the price from (or "by agreement"). The card opens the listing. */
export function ListingCard({ listing }: { listing: ListingSummary }) {
  const place = [listing.city?.name, listing.deliveryAvailable ? "доставка" : null].filter(Boolean).join(" · ")
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
    >
      <div className="aspect-4/3 bg-muted">
        {listing.photo ? (
          <EggImage image={listing.photo} alt={listing.title} sizes="(min-width: 1024px) 25vw, 50vw" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="flex flex-col gap-1 p-4">
        <Badge variant="outline" className="w-fit">
          {LISTING_TYPE_LABELS[listing.type]}
        </Badge>
        <h3 className="font-semibold">{listing.title}</h3>
        <p className="text-sm text-muted-foreground">{listing.creator.displayName}</p>
        <p className="font-medium">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</p>
        {place ? <p className="text-xs text-muted-foreground">{place}</p> : null}
      </div>
    </Link>
  )
}
