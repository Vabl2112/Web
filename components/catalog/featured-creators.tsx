import Link from "next/link"
import { CreatorCard } from "@/components/catalog/creator-card"
import { WriteButton } from "@/components/messaging/write-button"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"

const SHOWN = 3

/** The masters on the front page: the first few showcases as the large cards of the list, and a link to all of them. Nothing when there are none. */
export async function FeaturedCreators() {
  const page = await unwrap(serverApi.GET("/v1/creators", { params: { query: { limit: SHOWN } } }))
  if (page.items.length === 0) return null
  return (
    <section aria-labelledby="featured-creators" className="flex flex-col gap-4 pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="featured-creators" className="text-2xl font-bold">
          Мастера
        </h2>
        <Link href="/creators" className="text-sm font-medium underline underline-offset-4">
          Все мастера
        </Link>
      </div>
      <ul className="flex flex-col gap-4">
        {page.items.map((creator) => (
          <li key={creator.id}>
            <CreatorCard creator={creator} action={<WriteButton creatorId={creator.id} variant="outline" className="w-full sm:w-auto" />} />
          </li>
        ))}
      </ul>
    </section>
  )
}
