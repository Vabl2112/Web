"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useChat } from "@/components/messaging/chat-provider"

interface OpenChatProps {
  /** The conversation to open; without it the list of conversations. */
  conversationId?: string
  /** The page to show under the window (the address of a link from an e-mail is not a page any more). */
  then: string
}

/** The old addresses of the conversations (`/messages/...`, `/cabinet/messages/...`) stay as links: they open the chat window over `then`. */
export function OpenChat({ conversationId, then }: OpenChatProps) {
  const chat = useChat()
  const router = useRouter()
  useEffect(() => {
    chat.open(conversationId)
    router.replace(then)
  }, [chat, conversationId, router, then])
  return <p className="p-8 text-center text-sm text-muted-foreground">Открываем сообщения…</p>
}
