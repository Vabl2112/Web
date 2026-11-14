"use client"

import { type ComponentProps, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { useChat } from "@/components/messaging/chat-provider"
import { MessageComposer } from "@/components/messaging/message-composer"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session"
import { useFeatures } from "@/lib/features"
import { refreshInbox } from "@/lib/messaging-hooks"
import { cn } from "@/lib/utils"

/** The query that brings a person back to the open form after the login (AC-18); its value is the creator, as a page may list many. */
const WRITE_PARAM = "write"

interface WriteButtonProps {
  creatorId: string
  /** The listing the person is looking at: it goes with the first message as a card. */
  listing?: { id: string; title: string }
  /** The large button of a showcase header (capitals, wide), instead of the plain one. */
  prominent?: boolean
  /** A text the box starts with, for a message that is prepared (the summary of the calculator). */
  prefill?: string
  /** The words on the button; "Написать" by default. */
  label?: string
  /** More classes for the button, for the place it stands in (for example the full width of a card). */
  className?: string
  variant?: ComponentProps<typeof Button>["variant"]
}

const PROMINENT = "px-8 py-6 text-base font-semibold uppercase tracking-wide"

/**
 * "Написать" on a showcase or a listing. A guest is sent to the login page and comes back to this page with the form open; a signed-in
 * person writes in a dialog and the new conversation opens in the chat window. Nothing is shown while messaging is off (AC-45).
 */
export function WriteButton({ creatorId, listing, prominent = false, prefill, label = "Написать", className, variant }: WriteButtonProps) {
  const { messaging } = useFeatures()
  const { account, isLoading } = useSession()
  const chat = useChat()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const wantsForm = searchParams.get(WRITE_PARAM) === creatorId
  const [opened, setOpened] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!messaging || isLoading) return null

  if (account === null) {
    // The other filters of the page stay, so the person comes back to the same list.
    const back = new URLSearchParams(searchParams.toString())
    back.set(WRITE_PARAM, creatorId)
    return (
      <Button asChild variant={variant} className={cn("w-fit", prominent && PROMINENT, className)}>
        <Link href={`/login?returnTo=${encodeURIComponent(`${pathname}?${back.toString()}`)}`}>{label}</Link>
      </Button>
    )
  }

  const open = opened || (wantsForm && !dismissed)

  const close = () => {
    setOpened(false)
    setDismissed(true)
  }

  const send = async (text: string, clientMessageId: string) => {
    const conversation = await unwrap(
      api.POST("/v1/conversations", { body: { creatorId, ...(listing ? { listingId: listing.id } : {}), text, clientMessageId } }),
    )
    await refreshInbox()
    close()
    chat.open(conversation.id)
  }

  return (
    <>
      <Button variant={variant} className={cn("w-fit", prominent && PROMINENT, className)} onClick={() => setOpened(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpened(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Написать создателю</DialogTitle>
            <DialogDescription>{listing ? `Вы спрашиваете о позиции «${listing.title}».` : "Расскажите, что вас интересует."}</DialogDescription>
          </DialogHeader>
          <MessageComposer onSend={send} submitLabel="Отправить" initialText={prefill} />
        </DialogContent>
      </Dialog>
    </>
  )
}
