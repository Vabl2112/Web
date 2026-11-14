import type { Metadata } from "next"
import { OpenChat } from "@/components/messaging/open-chat"

// Private: `proxy.ts` sends a guest to the login page before this renders, and no search engine needs it.
export const metadata: Metadata = { title: "Сообщения — EGG", robots: { index: false } }

/** The conversations are a window, not a page: the old address opens the window over the front page. */
export default function MessagesPage() {
  return <OpenChat then="/" />
}
