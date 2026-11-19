"use client"

import { useState } from "react"
import { Stars } from "@/components/catalog/rating-stars"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { expectOk } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import type { Feedback } from "@/lib/catalog"

const DATE = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" })

interface DeleteFeedbackButtonProps {
  id: string
  label: string
  onDeleted(): void
}

/** "Удалить" with a question first: the author deletes their own feedback, an administrator any (AC-47). */
export function DeleteFeedbackButton({ id, label, onDeleted }: DeleteFeedbackButtonProps) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const remove = async () => {
    setBusy(true)
    setFailure(null)
    try {
      await expectOk(api.DELETE("/v1/feedback/{id}", { params: { path: { id } } }))
      setOpen(false)
      onDeleted()
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" className="w-fit text-muted-foreground" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить отзыв?</DialogTitle>
            <DialogDescription>Отзыв пропадёт, а оценка мастера пересчитается. Вернуть его нельзя.</DialogDescription>
          </DialogHeader>
          {failure ? <p role="alert" className="text-sm text-destructive">{failure}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Не удалять
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void remove()}>
              {busy ? "Удаляем…" : "Да, удалить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface FeedbackItemProps {
  feedback: Feedback
  /** An administrator may delete any feedback; the author's own is deleted in the form above the list. */
  canDelete: boolean
  onDeleted(): void
}

export function FeedbackItem({ feedback, canDelete, onDeleted }: FeedbackItemProps) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{feedback.authorName}</span>
        <Stars value={feedback.rating} />
        <span className="sr-only">Оценка {feedback.rating} из 5</span>
        <time dateTime={feedback.createdAt} className="text-sm text-muted-foreground">
          {DATE.format(new Date(feedback.createdAt))}
        </time>
      </div>
      {feedback.text ? <p className="break-words whitespace-pre-line">{feedback.text}</p> : null}
      {canDelete ? <DeleteFeedbackButton id={feedback.id} label="Удалить (администратор)" onDeleted={onDeleted} /> : null}
    </li>
  )
}
