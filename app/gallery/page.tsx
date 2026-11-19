import type { Metadata } from "next"
import { GalleryFeed } from "@/components/catalog/gallery-feed"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Фотогалерея — EGG" }

export default function GalleryPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <GalleryFeed
      basePath="/gallery"
      searchParams={searchParams}
      title="Фотогалерея"
      description="Найдите вдохновение среди работ мастеров. Нажмите на работу, чтобы открыть витрину её автора."
    />
  )
}
