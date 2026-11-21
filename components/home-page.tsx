import { cookies } from "next/headers"
import { FeaturedCreators } from "@/components/catalog/featured-creators"
import { GalleryFeed } from "@/components/catalog/gallery-feed"
import { Landing } from "@/components/home/landing"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"
import { SESSION_MARKER_COOKIE } from "@/proxy"

/** How many of the newest works the landing reads: the collage, the gallery and the covers of the best masters are taken from them. */
const LANDING_WORKS = 60
/** How many of the best rated masters the landing shows. */
const LANDING_MASTERS = 3

/**
 * The front page. A guest gets the landing of the first front page; a person who has signed in (the marker cookie of a session, read as
 * the router reads it) gets the board of works of every published showcase, filtered by category, and under it the masters. A guest who
 * follows an address with a category gets the board too, since that is what the address shows.
 */
export async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const query = parseCatalogQuery(params)
  const guest = !(await cookies()).get(SESSION_MARKER_COOKIE)?.value
  if (guest && query.categoryId === undefined && query.subcategoryId === undefined) {
    const [works, creators] = await Promise.all([
      unwrap(serverApi.GET("/v1/gallery", { params: { query: { limit: LANDING_WORKS } } })),
      unwrap(serverApi.GET("/v1/creators", { params: { query: { sort: "RATING", limit: LANDING_MASTERS } } })),
    ])
    return <Landing works={works.items} creators={creators.items} />
  }
  return (
    <GalleryFeed
      basePath="/"
      searchParams={Promise.resolve(params)}
      title="Найдите вдохновение"
      description="Работы творческих людей со всей страны. Нажмите на работу, чтобы открыть витрину автора и написать ему."
      after={<FeaturedCreators />}
    />
  )
}
