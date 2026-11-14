"use client"

import { ConversationList } from "@/components/messaging/conversation-list"
import { ConversationThread } from "@/components/messaging/conversation-thread"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { useSession } from "@/lib/auth/session"
import { useFeatures } from "@/lib/features"

interface ChatWindowProps {
  isOpen: boolean
  /** The conversation on the screen; `null` is the list of them. */
  conversationId: string | null
  onClose(): void
  onSelect(conversationId: string | null): void
}

/**
 * The messages in a window over the page, not on a page of their own: the list of conversations, and the conversation with the box to
 * answer. Nothing is drawn for a guest or while messaging is off (AC-45).
 */
export function ChatWindow({ isOpen, conversationId, onClose, onSelect }: ChatWindowProps) {
  const { messaging } = useFeatures()
  const { account } = useSession()
  if (!messaging || account === null) return null
  return (
    <Dialog open={isOpen} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="flex h-[min(680px,90dvh)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Сообщения</DialogTitle>
        <DialogDescription className="sr-only">Ваши переписки: список диалогов и сообщения выбранного диалога.</DialogDescription>
        {conversationId === null ? (
          <ConversationList onOpen={onSelect} />
        ) : (
          <ConversationThread conversationId={conversationId} onBack={() => onSelect(null)} onNavigate={onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
