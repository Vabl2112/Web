"use client"

import { type ReactNode, createContext, useContext, useMemo, useState } from "react"
import { ChatWindow } from "@/components/messaging/chat-window"

interface Chat {
  /** Opens the chat window on the list of conversations, or straight on one conversation. */
  open(conversationId?: string): void
  close(): void
}

const NOWHERE: Chat = { open: () => {}, close: () => {} }
const ChatContext = createContext<Chat>(NOWHERE)

export const useChat = () => useContext(ChatContext)

interface ChatState {
  isOpen: boolean
  conversationId: string | null
}

/**
 * Keeps the chat window above every page: it stays open while the person moves between pages, and anything can open it (the envelope in
 * the header, the cabinet, a message just sent). The conversations have no page of their own; a link from an e-mail opens the window.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ChatState>({ isOpen: false, conversationId: null })
  const chat = useMemo<Chat>(
    () => ({
      open: (conversationId) => setState({ isOpen: true, conversationId: conversationId ?? null }),
      close: () => setState((current) => ({ ...current, isOpen: false })),
    }),
    [],
  )
  return (
    <ChatContext value={chat}>
      {children}
      <ChatWindow
        isOpen={state.isOpen}
        conversationId={state.conversationId}
        onClose={chat.close}
        onSelect={(conversationId) => setState({ isOpen: true, conversationId })}
      />
    </ChatContext>
  )
}
