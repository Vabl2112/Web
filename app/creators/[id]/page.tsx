import { cache } from "react"
import type { Metadata } from "next"
import { CalculatorView } from "@/components/catalog/calculator-card"
import { CreatorProfileHeader } from "@/components/catalog/creator-profile-header"
import { PortfolioList } from "@/components/catalog/gallery-list"
import { ListingList } from "@/components/catalog/listing-list"
import { ShowcaseTabs, type ShowcaseTab } from "@/components/catalog/showcase-tabs"
import { Header } from "@/components/header"
import { WriteButton } from "@/components/messaging/write-button"
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
  // A section with nothing to show is not a tab at all (AC-05).
  const tabs: ShowcaseTab[] = []
  if (portfolio.items.length > 0) tabs.push({ id: "portfolio", label: "Портфолио", content: <PortfolioList initial={portfolio} creatorId={id} /> })
  if (listings.items.length > 0) tabs.push({ id: "listings", label: "Позиции", content: <ListingList initial={listings} creatorId={id} /> })
  if (creator.calculator) tabs.push({ id: "calculator", label: "Калькулятор", content: <CalculatorView calculator={creator.calculator} creatorId={id} /> })
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="border-b border-border">
          <CreatorProfileHeader creator={creator}>
            <WriteButton creatorId={id} prominent />
          </CreatorProfileHeader>
        </section>
        <section className="pt-6">
          <ShowcaseTabs tabs={tabs} />
        </section>
      </main>
    </div>
  )
}
