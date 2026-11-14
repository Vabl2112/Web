import { GalleryFeed } from "@/components/catalog/gallery-feed"
import type { SearchParams } from "@/lib/search-params"

/** The front page: the board of works of every published showcase, filtered by category (the creators have a section of their own). */
export function HomePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <GalleryFeed
      basePath="/"
      searchParams={searchParams}
      title="Найдите вдохновение"
      description="Работы творческих людей со всей страны. Нажмите на работу, чтобы открыть витрину автора и написать ему."
    />
  )
}
