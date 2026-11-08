import { cache } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { EggImage } from "@/components/egg-image"
import { Header } from "@/components/header"
import { WriteButton } from "@/components/messaging/write-button"
import { Badge } from "@/components/ui/badge"
import { loadOrNotFound, serverApi } from "@/lib/api/server"
import { LISTING_TYPE_LABELS, type Listing } from "@/lib/catalog"
import { formatPriceFrom } from "@/lib/format"

type Props = { params: Promise<{ id: string }> }

const MAX_DESCRIPTION = 160

const loadListing = cache((id: string) => loadOrNotFound(serverApi.GET("/v1/listings/{id}", { params: { path: { id } } })))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await loadListing((await params).id)
  return { title: `${listing.title} — EGG`, description: listing.description.slice(0, MAX_DESCRIPTION) }
}

/** The facts that belong to one type of listing only: how long a service takes, whether a product is in stock, the lead time of an order. */
function typeFact(listing: Listing): string | null {
  if (listing.type === "SERVICE" && listing.durationText) return `Длительность: ${listing.durationText}`
  if (listing.type === "READY_PRODUCT" && listing.inStock !== undefined) return listing.inStock ? "В наличии" : "Нет в наличии"
  if (listing.type === "MADE_TO_ORDER" && listing.leadTimeDays !== undefined) return `Срок изготовления: ${listing.leadTimeDays} дн.`
  return null
}

export default async function ListingPage({ params }: Props) {
  const listing = await loadListing((await params).id)
  const fact = typeFact(listing)
  const place = [listing.city?.name, listing.deliveryAvailable ? "возможна доставка" : null].filter(Boolean).join(" · ")
  const attributes = Object.entries(listing.attributes)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-2">
        {listing.photos.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {listing.photos.map((photo, index) => (
              <li key={photo.variants[0]?.url ?? index}>
                <EggImage image={photo} alt={listing.title} sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full rounded-xl" />
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-col gap-4">
          <Badge variant="outline" className="w-fit">
            {LISTING_TYPE_LABELS[listing.type]}
          </Badge>
          <h1 className="text-3xl font-bold text-balance">{listing.title}</h1>
          <p className="text-muted-foreground">
            <Link href={`/creators/${listing.creator.id}`} className="underline underline-offset-4">
              {listing.creator.displayName}
            </Link>
          </p>
          <p className="text-2xl font-semibold">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</p>
          <WriteButton creatorId={listing.creator.id} listing={{ id: listing.id, title: listing.title }} />
          {fact ? <p>{fact}</p> : null}
          {place ? <p className="text-sm text-muted-foreground">{place}</p> : null}
          {listing.description ? <p className="leading-relaxed whitespace-pre-line">{listing.description}</p> : null}
          {attributes.length > 0 ? (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
              {attributes.map(([name, value]) => (
                <div key={name} className="contents">
                  <dt className="text-muted-foreground">{name}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      </main>
    </div>
  )
}
