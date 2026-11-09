"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { OFFER_LOGIN_EVENT, UPGRADE_EVENT, returnToOf } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session"

/** Whether the event has happened (and not been dismissed): for a notice that stays until the person acts. */
function useEvent(name: string): [boolean, () => void] {
  const [happened, setHappened] = useState(false)
  useEffect(() => {
    const listener = () => setHappened(true)
    window.addEventListener(name, listener)
    return () => window.removeEventListener(name, listener)
  }, [name])
  return [happened, () => setHappened(false)]
}

/** The page on which the event happened, so that the notice belongs to that page only. */
function useEventOnPage(name: string, pathname: string): [boolean, () => void] {
  const [page, setPage] = useState<string | null>(null)
  useEffect(() => {
    const listener = () => setPage(window.location.pathname)
    window.addEventListener(name, listener)
    return () => window.removeEventListener(name, listener)
  }, [name])
  return [page === pathname, () => setPage(null)]
}

/**
 * The two answers of the API that the person must hear about on any page: `426` (this build of the page is too old: reload it) and
 * `401` on a public page (the action needs an account: sign in). The client of the API only raises the events; this shows them.
 * The notice to sign in belongs to the page where it happened: it goes away with the page, with a sign-in, and with its own button.
 */
export function ApiNotices() {
  const pathname = usePathname()
  const { account } = useSession()
  const [upgrade] = useEvent(UPGRADE_EVENT)
  const [offered, dismiss] = useEventOnPage(OFFER_LOGIN_EVENT, pathname)
  const offerLogin = offered && account === null
  if (!upgrade && !offerLogin) return null

  return (
    <div role="alert" className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background p-4 shadow-lg">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        {upgrade ? (
          <>
            <p className="text-sm">Вышла новая версия сайта. Обновите страницу, чтобы продолжить.</p>
            <Button onClick={() => window.location.reload()}>Обновить страницу</Button>
          </>
        ) : (
          <>
            <p className="text-sm">Чтобы выполнить это действие, войдите в аккаунт.</p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/login?returnTo=${encodeURIComponent(returnToOf(window.location.pathname, window.location.search))}`}>
                  Войти
                </Link>
              </Button>
              <Button type="button" variant="ghost" onClick={dismiss}>
                Закрыть
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
