import { cache } from "react"
import type { Metadata } from "next"
import { CreatorProfileHeader } from "@/components/catalog/creator-profile-header"
import { PortfolioList } from "@/components/catalog/gallery-list"
import { ListingList } from "@/components/catalog/listing-list"
import { Header } from "@/components/header"
import { loadOrNotFound, serverApi } from "@/lib/api/server"

type Props = { params: Promise<{ id: string }> }

const MAX_DESCRIPTION = 160

// One read of the showcase serves both the title of the page and its body.
const loadCreator = cache((id: string) => loadOrNotFound(serverApi.GET("/v1/creators/{id}", { params: { path: { id } } })))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const creator = await loadCreator((await params).id)
  return { title: `${creator.displayName} — EGG`, description: creator.bio?.slice(0, MAX_DESCRIPTION) }
}

export default async function CreatorPage({ params }: Props) {
  const { id } = await params
  const [creator, listings, portfolio] = await Promise.all([
    loadCreator(id),
    loadOrNotFound(serverApi.GET("/v1/creators/{id}/listings", { params: { path: { id } } })),
    loadOrNotFound(serverApi.GET("/v1/creators/{id}/portfolio-items", { params: { path: { id } } })),
  ])
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <CreatorProfileHeader creator={creator} />
        {portfolio.items.length > 0 ? (
          <section aria-labelledby="portfolio" className="flex flex-col gap-4">
            <h2 id="portfolio" className="text-2xl font-semibold">
              Работы
            </h2>
            <PortfolioList initial={portfolio} creatorId={id} />
          </section>
        ) : null}
        {listings.items.length > 0 ? (
          <section aria-labelledby="listings" className="flex flex-col gap-4">
            <h2 id="listings" className="text-2xl font-semibold">
              Позиции
            </h2>
            <ListingList initial={listings} creatorId={id} />
          </section>
        ) : null}
      </main>
    </div>
  )
}
