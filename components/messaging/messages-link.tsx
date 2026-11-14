"use client"

import { MessageSquare } from "lucide-react"
import { useChat } from "@/components/messaging/chat-provider"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth/session"
import { useFeatures } from "@/lib/features"
import { useInboxSummary } from "@/lib/messaging-hooks"

/** The count for a badge: the number, or "99+". */
export function badgeText(count: number): string {
  return count > 99 ? "99+" : String(count)
}

/** The icon of the messages in the header, with the number of conversations that have something unread; it opens the chat window. Hidden while messaging is off (AC-45). */
export function MessagesLink() {
  const { messaging } = useFeatures()
  const { account } = useSession()
  const chat = useChat()
  const { data } = useInboxSummary(messaging && account !== null)
  if (!messaging || account === null) return null
  const unread = data?.unreadConversations ?? 0
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative text-muted-foreground"
      aria-label={unread > 0 ? `Сообщения, диалогов с новыми: ${unread}` : "Сообщения"}
      onClick={() => chat.open()}
    >
      <MessageSquare className="size-5" />
      {unread > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-white">
          {badgeText(unread)}
        </span>
      ) : null}
    </Button>
  )
}
