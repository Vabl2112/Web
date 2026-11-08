"use client"

import useSWR from "swr"
import { Header } from "@/components/header"
import { ProfileCard } from "@/components/profile-card"
import { ServicesCard } from "@/components/services-card"
import { PortfolioMasonry } from "@/components/portfolio-masonry"
import { DynamicTabs, type TabItem } from "@/components/dynamic-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import type { ArtistProfile } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then(res => res.json())

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <Skeleton className="size-36 shrink-0 rounded-full sm:size-44" />
      <div className="flex flex-1 flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full max-w-lg" />
        <Skeleton className="h-12 w-52" />
      </div>
      <div className="flex flex-col items-end gap-4">
        <Skeleton className="h-6 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function PortfolioSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Skeleton
          key={i}
          className={`rounded-xl ${i % 3 === 0 ? "h-80" : i % 3 === 1 ? "h-64" : "h-48"}`}
        />
      ))}
    </div>
  )
}

export function ArtistProfilePage() {
  const { data, error, isLoading } = useSWR<ArtistProfile>("/api/artist/1", fetcher)

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Ошибка загрузки данных</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Profile Section */}
        <section className="border-b border-border pb-8">
          {isLoading ? (
            <ProfileSkeleton />
          ) : data ? (
            <ProfileCard artist={data.artist} />
          ) : null}
        </section>

        {/* Tabs Section */}
        <section className="pt-6">
          {(() => {
            const tabs: TabItem[] = [
              {
                id: "portfolio",
                label: "Портфолио",
                content: isLoading ? (
                  <PortfolioSkeleton />
                ) : data ? (
                  <PortfolioMasonry items={data.portfolio} />
                ) : null
              },
              {
                id: "services",
                label: "Услуги и Товары",
                content: data ? <ServicesCard services={data.services} /> : null
              }
            ]
            return (
              <DynamicTabs 
                tabs={tabs} 
                defaultEnabled={["portfolio", "services"]}
              />
            )
          })()}
        </section>
      </main>
    </div>
  )
}
