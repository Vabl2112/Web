"use client"

import { useRef, useState } from "react"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { errorTextOf } from "@/lib/api/errors"
import { MAX_MESSAGE_LENGTH, messageTextProblem } from "@/lib/messaging"

interface MessageComposerProps {
  /** Sends the text with the given `clientMessageId`; throws when the send failed. */
  onSend(text: string, clientMessageId: string): Promise<void>
  placeholder?: string
  submitLabel?: string
}

/**
 * The box to write a message. The `clientMessageId` is made when the person presses send and kept until the send succeeds: a retry after
 * a failure carries the same id, so a message that did arrive is never doubled; a changed text is a new message with a new id.
 */
export function MessageComposer({ onSend, placeholder = "Напишите сообщение", submitLabel = "Отправить" }: MessageComposerProps) {
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const pendingId = useRef<string | null>(null)

  const send = async () => {
    if (busy) return
    const problem = messageTextProblem(text)
    if (problem) return setFailure(problem)
    pendingId.current ??= crypto.randomUUID()
    setBusy(true)
    setFailure(null)
    try {
      await onSend(text.trim(), pendingId.current)
      setText("")
      pendingId.current = null
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        void send()
      }}
      className="flex flex-col gap-2"
    >
      {failure ? <FormAlert message={failure} /> : null}
      <Textarea
        value={text}
        // Read-only while the message is on its way: what is typed meanwhile would be wiped when the send succeeds.
        readOnly={busy}
        rows={3}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          setText(event.target.value)
          pendingId.current = null
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            void send()
          }
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">Ctrl + Enter — отправить</span>
        <Button type="submit" disabled={busy || text.trim() === ""}>
          {busy ? "Отправляем…" : submitLabel}
        </Button>
      </div>
    </form>
  )
}
