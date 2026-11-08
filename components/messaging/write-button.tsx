"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MessageComposer } from "@/components/messaging/message-composer"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session"
import { useFeatures } from "@/lib/features"
import { conversationHref } from "@/lib/messaging"
import { refreshInbox } from "@/lib/messaging-hooks"

/** The query that brings a person back to the open form after the login (AC-18). */
const WRITE_PARAM = "write"

interface WriteButtonProps {
  creatorId: string
  /** The listing the person is looking at: it goes with the first message as a card. */
  listing?: { id: string; title: string }
}

/**
 * "Написать" on a showcase or a listing. A guest is sent to the login page and comes back to this page with the form open; a signed-in
 * person writes in a dialog and lands in the new conversation. Nothing is shown while messaging is off (AC-45).
 */
export function WriteButton({ creatorId, listing }: WriteButtonProps) {
  const { messaging } = useFeatures()
  const { account, isLoading } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const wantsForm = useSearchParams().get(WRITE_PARAM) === "1"
  const [opened, setOpened] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!messaging || isLoading) return null

  if (account === null) {
    const back = encodeURIComponent(`${pathname}?${WRITE_PARAM}=1`)
    return (
      <Button asChild className="w-fit">
        <Link href={`/login?returnTo=${back}`}>Написать</Link>
      </Button>
    )
  }

  const open = opened || (wantsForm && !dismissed)

  const send = async (text: string, clientMessageId: string) => {
    const conversation = await unwrap(
      api.POST("/v1/conversations", { body: { creatorId, ...(listing ? { listingId: listing.id } : {}), text, clientMessageId } }),
    )
    await refreshInbox()
    router.push(conversationHref("BUYER", conversation.id))
  }

  return (
    <>
      <Button className="w-fit" onClick={() => setOpened(true)}>
        Написать
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpened(next)
          if (!next) setDismissed(true)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Написать создателю</DialogTitle>
            <DialogDescription>{listing ? `Вы спрашиваете о позиции «${listing.title}».` : "Расскажите, что вас интересует."}</DialogDescription>
          </DialogHeader>
          <MessageComposer onSend={send} submitLabel="Отправить" />
        </DialogContent>
      </Dialog>
    </>
  )
}
