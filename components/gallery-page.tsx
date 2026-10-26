"use client"

import { useState } from "react"
import useSWR from "swr"
import { Header } from "@/components/header"
import { GalleryFilters } from "@/components/gallery-filters"
import { GalleryMasonry } from "@/components/gallery-masonry"
import { Skeleton } from "@/components/ui/skeleton"
import type { GalleryCategory, GalleryImage } from "@/lib/types"

interface GalleryResponse {
  categories: GalleryCategory[]
  currentCategory: GalleryCategory
  images: GalleryImage[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const SKELETON_HEIGHTS = [220, 280, 320, 240, 300, 260]

export function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("tattoo")
  const [activeSubFilter, setActiveSubFilter] = useState<string | null>(null)

  const apiUrl = `/api/gallery?category=${activeCategory}${activeSubFilter ? `&subCategory=${activeSubFilter}` : ""}`
  
  const { data, isLoading } = useSWR<GalleryResponse>(apiUrl, fetcher, {
    keepPreviousData: true,
  })

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-foreground">Фотогалерея</h1>
          <p className="text-muted-foreground">
            Найдите вдохновение среди работ лучших мастеров
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          {data ? (
            <GalleryFilters
              categories={data.categories}
              activeCategory={activeCategory}
              activeSubFilter={activeSubFilter}
              onCategoryChange={setActiveCategory}
              onSubFilterChange={setActiveSubFilter}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-24 rounded-full" />
                ))}
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-9 w-20 rounded-full" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gallery Grid */}
        {isLoading && !data ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((col) => (
              <div key={col} className="flex flex-col gap-4">
                {[1, 2, 3].map((row) => (
                  <Skeleton
                    key={row}
                    className="rounded-xl"
                    style={{
                      height: `${SKELETON_HEIGHTS[(col * 3 + row) % SKELETON_HEIGHTS.length]}px`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : data?.images && data.images.length > 0 ? (
          <GalleryMasonry images={data.images} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Нет изображений для выбранного фильтра
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
