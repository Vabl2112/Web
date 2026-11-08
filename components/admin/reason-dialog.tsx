"use client"

import { useState } from "react"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { errorTextOf } from "@/lib/api/errors"
import { MAX_REASON_LENGTH, reasonProblem } from "@/lib/moderation"

interface ReasonDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  /** Makes the decision with the reason; throws when the API refused. The dialog closes when it did not throw. */
  onConfirm(reason: string): Promise<void>
  onClose(): void
}

function ReasonForm({ confirmLabel, onConfirm, onClose }: Pick<ReasonDialogProps, "confirmLabel" | "onConfirm" | "onClose">) {
  const [reason, setReason] = useState("")
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const confirm = async () => {
    const problem = reasonProblem(reason)
    if (problem) return setFailure(problem)
    setBusy(true)
    setFailure(null)
    try {
      await onConfirm(reason.trim())
      onClose()
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {failure ? <FormAlert message={failure} /> : null}
      <Textarea
        value={reason}
        rows={4}
        maxLength={MAX_REASON_LENGTH}
        placeholder="Причина"
        aria-label="Причина"
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Отмена
        </Button>
        <Button type="button" disabled={busy} onClick={() => void confirm()}>
          {busy ? "Сохраняем…" : confirmLabel}
        </Button>
      </div>
    </div>
  )
}

/** A decision that needs a reason (a rejection, a suspension): the reason is shown to the creator or kept in the audit log. */
export function ReasonDialog({ open, title, description, confirmLabel, onConfirm, onClose }: ReasonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {open ? <ReasonForm confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  )
}
