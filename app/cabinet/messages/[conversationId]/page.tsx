import { OpenChat } from "@/components/messaging/open-chat"

/** The link of an e-mail to a creator about a new message: opens the window on this conversation over the cabinet. */
export default async function CabinetConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  return <OpenChat conversationId={(await params).conversationId} then="/cabinet" />
}
