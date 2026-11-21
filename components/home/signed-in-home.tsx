"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Sparkles } from "lucide-react"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { api } from "@/lib/api/client"
import { useGet } from "@/lib/api/hooks"
import { useSession } from "@/lib/auth/session"
import { PROFILE_KEY } from "@/lib/cabinet-hooks"

/** Where the front page sends a master: the showcase as the public sees it, or the cabinet while the public cannot see it yet. */
export function masterHomeOf(profile: { id: string; status: string; suspensionReasons: unknown[] }): string {
  return profile.status === "PUBLISHED" && profile.suspensionReasons.length === 0 ? `/creators/${profile.id}` : "/cabinet"
}

/**
 * The place of the feed of a person who has signed in and is not a master. The feed is still being designed, so this says so and leads
 * to the sections that exist.
 */
export function FeedPlaceholder() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:py-24">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Sparkles aria-hidden className="size-7 text-amber-500" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-balance sm:text-4xl">Здесь будет ваша лента</h1>
          <p className="mt-4 max-w-lg text-pretty text-muted-foreground">
            Мы готовим ленту с новыми работами и предложениями мастеров. А пока загляните в разделы сайта.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2 rounded-full px-8">
              <Link href="/gallery">
                Фотогалерея
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link href="/creators">Мастера</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full px-8">
              <Link href="/listings">Услуги и товары</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Waiting() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Skeleton className="size-12 rounded-full" />
      <span className="sr-only">Загрузка…</span>
    </div>
  )
}

/**
 * The front page of a person who has signed in, as in the first web: a master goes to his or her own page, everybody else gets the place
 * of the feed. The server sends no cookie of the user to the API, so the role is known only here, from the session of the browser.
 */
export function SignedInHome() {
  const router = useRouter()
  const { isLoading, isCreator } = useSession()
  const { data: profile, error } = useGet(isCreator ? PROFILE_KEY : null, () => api.GET("/v1/me/creator-profile"), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })
  const target = profile ? masterHomeOf(profile) : isCreator && error ? "/cabinet" : null

  useEffect(() => {
    if (target) router.replace(target)
  }, [router, target])

  if (isLoading || isCreator) return <Waiting />
  return <FeedPlaceholder />
}
