import { cache } from "react"
import Link from "next/link"
import type { Metadata } from "next"
import { ChevronLeft, Clock, MapPin, Package, Truck, type LucideIcon } from "lucide-react"
import { EggImage } from "@/components/egg-image"
import { Header } from "@/components/header"
import { WriteButton } from "@/components/messaging/write-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { initialsOf } from "@/lib/auth/initials"
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

interface Fact {
  icon: LucideIcon
  text: string
}

/** The fact that belongs to one type of listing only: how long a service takes, whether a product is in stock, the lead time of an order. */
function typeFact(listing: Listing): Fact | null {
  if (listing.type === "SERVICE" && listing.durationText) return { icon: Clock, text: `Длительность: ${listing.durationText}` }
  if (listing.type === "READY_PRODUCT" && listing.inStock !== undefined) return { icon: Package, text: listing.inStock ? "В наличии" : "Нет в наличии" }
  if (listing.type === "MADE_TO_ORDER" && listing.leadTimeDays !== undefined) return { icon: Clock, text: `Срок изготовления: ${listing.leadTimeDays} дн.` }
  return null
}

/** The facts under the price, each with its icon: the one of the type, the city, the delivery. Nothing is shown for what the API did not send. */
function factsOf(listing: Listing): Fact[] {
  const facts: (Fact | null)[] = [
    typeFact(listing),
    listing.city ? { icon: MapPin, text: listing.city.name } : null,
    listing.deliveryAvailable ? { icon: Truck, text: "Возможна доставка" } : null,
  ]
  return facts.filter((fact): fact is Fact => fact !== null)
}

/**
 * One listing, with the look of its card in the lists: the photos in rounded frames, the type, the title, the price in bold, the maker as
 * a row with an avatar that leads to the showcase, and the button to write.
 */
export default async function ListingPage({ params }: Props) {
  const listing = await loadListing((await params).id)
  const facts = factsOf(listing)
  const attributes = Object.entries(listing.attributes)
  const [firstPhoto, ...otherPhotos] = listing.photos
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:py-8">
        <Link href="/listings" className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft aria-hidden className="size-4" />
          Услуги и товары
        </Link>
        <div className="grid gap-8 lg:grid-cols-2">
          {firstPhoto ? (
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                <EggImage image={firstPhoto} alt={listing.title} sizes="(min-width: 1024px) 50vw, 100vw" className="h-auto w-full" />
              </div>
              {otherPhotos.length > 0 ? (
                <ul className="grid grid-cols-2 gap-3">
                  {otherPhotos.map((photo, index) => (
                    <li key={photo.variants[0]?.url ?? index} className="overflow-hidden rounded-2xl border border-border bg-muted">
                      <EggImage image={photo} alt="" sizes="(min-width: 1024px) 25vw, 50vw" className="h-auto w-full" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <Badge variant="outline" className="w-fit">
                {LISTING_TYPE_LABELS[listing.type]}
              </Badge>
              <h1 className="text-2xl font-bold text-balance text-foreground sm:text-3xl">{listing.title}</h1>
              <p className="text-3xl font-bold text-foreground">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</p>
            </div>
            <Link
              href={`/creators/${listing.creator.id}`}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-lg"
            >
              <Avatar className="size-10">
                <AvatarFallback>{initialsOf(listing.creator.displayName)}</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-foreground">{listing.creator.displayName}</span>
                <span className="text-sm text-muted-foreground">Открыть витрину</span>
              </span>
            </Link>
            <WriteButton creatorId={listing.creator.id} listing={{ id: listing.id, title: listing.title }} className="w-full sm:w-fit" />
            {facts.length > 0 ? (
              <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                {facts.map((fact) => (
                  <li key={fact.text} className="flex items-center gap-2">
                    <fact.icon aria-hidden className="size-4 shrink-0" />
                    {fact.text}
                  </li>
                ))}
              </ul>
            ) : null}
            {listing.description ? (
              <section className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold text-foreground">Описание</h2>
                <p className="leading-relaxed whitespace-pre-line text-foreground/90">{listing.description}</p>
              </section>
            ) : null}
            {attributes.length > 0 ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 text-lg font-semibold text-foreground">Характеристики</h2>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
                  {attributes.map(([name, value]) => (
                    <div key={name} className="contents">
                      <dt className="text-muted-foreground">{name}</dt>
                      <dd className="text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
}
