import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Landing } from "@/components/home/landing"
import { SignedInHome } from "@/components/home/signed-in-home"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, parseCatalogQuery } from "@/lib/catalog"
import type { SearchParams } from "@/lib/search-params"
import { SESSION_MARKER_COOKIE } from "@/proxy"

/** How many of the newest works the landing reads: the collage, the gallery and the covers of the best masters are taken from them. */
const LANDING_WORKS = 60
/** How many of the best rated masters the landing shows. */
const LANDING_MASTERS = 3

/**
 * The front page, as in the first web. A guest gets the landing; a person who has signed in (the marker cookie of a session, read as the
 * router reads it) goes on in the browser: a master to his or her own page, everybody else to the place of the feed. The board of works
 * with a category used to live here, so such an address goes on to `/gallery`.
 */
export async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseCatalogQuery(await searchParams)
  if (query.categoryId !== undefined || query.subcategoryId !== undefined) {
    redirect(catalogHref("/gallery", { categoryId: query.categoryId, subcategoryId: query.subcategoryId }))
  }
  if ((await cookies()).get(SESSION_MARKER_COOKIE)?.value) return <SignedInHome />
  const [works, creators] = await Promise.all([
    unwrap(serverApi.GET("/v1/gallery", { params: { query: { limit: LANDING_WORKS } } })),
    unwrap(serverApi.GET("/v1/creators", { params: { query: { sort: "RATING", limit: LANDING_MASTERS } } })),
  ])
  return <Landing works={works.items} creators={creators.items} />
}
