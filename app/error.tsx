"use client"

import { Button } from "@/components/ui/button"

/** What a page shows when reading its data failed (the backend is down or busy): the same words for everybody, and a way to try again. */
export default function ErrorPage({ reset }: { reset(): void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Не удалось загрузить страницу</h1>
      <p className="text-muted-foreground">Что-то пошло не так. Попробуйте ещё раз через минуту.</p>
      <Button onClick={reset}>Попробовать снова</Button>
    </main>
  )
}
