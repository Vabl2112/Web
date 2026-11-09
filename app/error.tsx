"use client"

import { startTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

/**
 * What a page shows when reading its data failed (the backend is down or busy): the same words for everybody, and a way to try again.
 * The data of these pages is read on the server, so trying again must read it again (`refresh`) and not only draw the same error anew.
 */
export default function ErrorPage({ reset }: { reset(): void }) {
  const router = useRouter()
  const tryAgain = () =>
    startTransition(() => {
      router.refresh()
      reset()
    })
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Не удалось загрузить страницу</h1>
      <p className="text-muted-foreground">Что-то пошло не так. Попробуйте ещё раз через минуту.</p>
      <Button onClick={tryAgain}>Попробовать снова</Button>
    </main>
  )
}
