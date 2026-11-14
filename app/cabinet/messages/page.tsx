import { OpenChat } from "@/components/messaging/open-chat"

/** The conversations are a window, not a page: the old address opens the window over the cabinet. */
export default function CabinetMessagesPage() {
  return <OpenChat then="/cabinet" />
}
