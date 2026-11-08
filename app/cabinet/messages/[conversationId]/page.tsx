import { ConversationThread } from "@/components/messaging/conversation-thread"

export default async function CabinetConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  return <ConversationThread conversationId={(await params).conversationId} />
}
