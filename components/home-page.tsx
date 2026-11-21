import { cookies } from "next/headers"
import { FeaturedCreators } from "@/components/catalog/featured-creators"
import { GalleryFeed } from "@/components/catalog/gallery-feed"
import { Hero } from "@/components/home/hero"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import type { SearchParams } from "@/lib/search-params"
import { SESSION_MARKER_COOKIE } from "@/proxy"

/** How many works the collage of the hero shows: two columns of two. */
const COLLAGE = 4

/**
 * The front page. A guest (no marker cookie of a session) first sees the opening block of the first front page; everybody sees the board
 * of works of every published showcase, filtered by category, and under it the masters (they have a page of their own).
 */
export async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const guest = !(await cookies()).has(SESSION_MARKER_COOKIE)
  const works = guest ? (await unwrap(serverApi.GET("/v1/gallery", { params: { query: { limit: COLLAGE } } }))).items : []
  return (
    <GalleryFeed
      basePath="/"
      searchParams={searchParams}
      title="Найдите вдохновение"
      description="Работы творческих людей со всей страны. Нажмите на работу, чтобы открыть витрину автора и написать ему."
      after={<FeaturedCreators />}
      hero={guest ? <Hero works={works} /> : undefined}
    />
  )
}
