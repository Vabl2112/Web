import type { Metadata } from "next"
import { GalleryFeed } from "@/components/catalog/gallery-feed"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Работы — EGG" }

export default function GalleryPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <GalleryFeed
      basePath="/gallery"
      searchParams={searchParams}
      title="Работы"
      description="Лента работ из опубликованных витрин. Нажмите на работу, чтобы открыть витрину её автора."
    />
  )
}
