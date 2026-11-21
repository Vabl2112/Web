"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Star } from "lucide-react"
import { FormAlert } from "@/components/auth/form-alert"
import { DeleteFeedbackButton } from "@/components/catalog/feedback-list"
import { Stars } from "@/components/catalog/rating-stars"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useGet } from "@/lib/api/hooks"
import { useSession } from "@/lib/auth/session"
import { cn } from "@/lib/utils"

const MAX_TEXT = 2000
const STARS = [1, 2, 3, 4, 5]

/** The key of what the signed-in person may do on this showcase; the tab refreshes it after any change. */
export const mineKey = (creatorId: string) => ["feedback-mine", creatorId] as const

/** What the signed-in person may do on this showcase and the feedback they left; nothing is read for a guest. The form and the list share it. */
export function useMyFeedback(creatorId: string) {
  const { account } = useSession()
  return useGet(account === null ? null : mineKey(creatorId), () => api.GET("/v1/creators/{id}/feedback/mine", { params: { path: { id: creatorId } } }), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })
}

interface FeedbackFormProps {
  creatorId: string
  /** Called after feedback was left or deleted, so the list and the stars on the page are read again. */
  onChanged(): void
}

/**
 * Where a person leaves their feedback (AC-47). A guest is sent to sign in; a person who has not been answered by this creator is told
 * how to get there; the owner sees nothing; everybody else has the stars and the text, or their feedback with a button to delete it.
 */
export function FeedbackForm({ creatorId, onChanged }: FeedbackFormProps) {
  const { account, isLoading } = useSession()
  const pathname = usePathname()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const { data: mine, mutate } = useMyFeedback(creatorId)

  if (isLoading) return null
  if (account === null) {
    return (
      <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Оставить отзыв можно после переписки с мастером.{" "}
        <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`} className="underline underline-offset-4">
          Войдите
        </Link>
        , чтобы написать ему.
      </p>
    )
  }
  if (mine === undefined) return null

  if (mine.feedback) {
    return (
      <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
        <h3 className="font-semibold">Ваш отзыв</h3>
        <Stars value={mine.feedback.rating} />
        {mine.feedback.text ? <p className="whitespace-pre-line">{mine.feedback.text}</p> : null}
        <DeleteFeedbackButton
          id={mine.feedback.id}
          label="Удалить мой отзыв"
          onDeleted={() => {
            void mutate()
            onChanged()
          }}
        />
      </section>
    )
  }

  if (!mine.canLeave) {
    return mine.reason === "NO_CONTACT" ? (
      <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        Оставить отзыв можно после переписки с мастером: напишите ему, и когда он ответит, здесь появится форма.
      </p>
    ) : null
  }

  const send = async () => {
    setBusy(true)
    setFailure(null)
    try {
      await unwrap(api.POST("/v1/creators/{id}/feedback", { params: { path: { id: creatorId } }, body: { rating, ...(text.trim() ? { text } : {}) } }))
      setRating(0)
      setText("")
      await mutate()
      onChanged()
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}
    >
      <h3 className="font-semibold">Оставить отзыв</h3>
      {failure ? <FormAlert message={failure} /> : null}
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">Ваша оценка</legend>
        <div className="flex gap-1">
          {STARS.map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Оценка ${star} из 5`}
              aria-pressed={rating === star}
              onClick={() => setRating(star)}
              className="rounded-md p-1 transition-colors hover:bg-muted"
            >
              <Star className={cn("size-6", star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="feedback-text" className="text-sm font-medium">
          Текст отзыва (необязательно)
        </Label>
        <Textarea id="feedback-text" rows={4} maxLength={MAX_TEXT} value={text} onChange={(event) => setText(event.target.value)} />
      </div>
      <Button type="submit" className="w-fit" disabled={busy || rating === 0}>
        {busy ? "Отправляем…" : "Отправить отзыв"}
      </Button>
    </form>
  )
}
