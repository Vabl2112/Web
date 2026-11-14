import type { Metadata } from "next"
import { OpenChat } from "@/components/messaging/open-chat"

export const metadata: Metadata = { title: "Сообщения — EGG", robots: { index: false } }

/** The link of an e-mail about a new message: opens the window on this conversation over the front page. */
export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  return <OpenChat conversationId={(await params).conversationId} then="/" />
}
