"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { OFFER_LOGIN_EVENT, UPGRADE_EVENT, returnToOf } from "@/lib/api/client"

function useEvent(name: string): boolean {
  const [happened, setHappened] = useState(false)
  useEffect(() => {
    const listener = () => setHappened(true)
    window.addEventListener(name, listener)
    return () => window.removeEventListener(name, listener)
  }, [name])
  return happened
}

/**
 * The two answers of the API that the person must hear about on any page: `426` (this build of the page is too old: reload it) and
 * `401` on a public page (the action needs an account: sign in). The client of the API only raises the events; this shows them.
 */
export function ApiNotices() {
  const upgrade = useEvent(UPGRADE_EVENT)
  const offerLogin = useEvent(OFFER_LOGIN_EVENT)
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
            <Button asChild>
              <Link href={`/login?returnTo=${encodeURIComponent(returnToOf(window.location.pathname, window.location.search))}`}>
                Войти
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
