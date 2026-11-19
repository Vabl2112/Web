"use client"

import Link from "next/link"
import { Bell } from "lucide-react"
import { useChat } from "@/components/messaging/chat-provider"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { api } from "@/lib/api/client"
import { useGet } from "@/lib/api/hooks"
import { useSession } from "@/lib/auth/session"
import { PROFILE_KEY } from "@/lib/cabinet-hooks"
import { useFeatures } from "@/lib/features"
import { useInboxSummary } from "@/lib/messaging-hooks"

interface Notice {
  id: string
  title: string
  detail?: string
  /** A page the notice leads to; a notice without one runs `onSelect`. */
  href?: string
  onSelect?: () => void
}

const ROW = "flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted"

/**
 * The bell of the header. It lists what needs the person's attention and is already known to the API: conversations with something unread
 * and, for a creator, a showcase that moderation sent back with a reason. Nothing else is invented: with nothing to show it says so.
 */
export function NotificationsBell() {
  const { messaging } = useFeatures()
  const { account, isCreator } = useSession()
  const chat = useChat()
  const { data: inbox } = useInboxSummary(messaging && account !== null)
  const { data: profile } = useGet(isCreator ? PROFILE_KEY : null, () => api.GET("/v1/me/creator-profile"), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })
  if (account === null) return null

  const notices: Notice[] = []
  const unread = inbox?.unreadConversations ?? 0
  if (messaging && unread > 0) notices.push({ id: "messages", title: `Новые сообщения: ${unread}`, onSelect: () => chat.open() })
  if (profile?.status === "REJECTED") {
    notices.push({ id: "rejected", title: "Витрину отклонили", detail: profile.rejectionReason, href: "/cabinet" })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hidden text-muted-foreground sm:flex"
          aria-label={notices.length > 0 ? `Уведомления, новых: ${notices.length}` : "Уведомления"}
        >
          <Bell className="size-5" />
          {notices.length > 0 ? <span aria-hidden className="absolute top-2 right-2 size-2 rounded-full bg-destructive" /> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <p className="px-3 py-2 text-sm font-semibold">Уведомления</p>
        {notices.length === 0 ? <p className="px-3 pb-3 text-sm text-muted-foreground">Пока ничего нового.</p> : null}
        <ul className="flex flex-col">
          {notices.map((notice) => (
            <li key={notice.id}>
              {notice.href ? (
                <Link href={notice.href} className={ROW}>
                  <span className="text-sm font-medium">{notice.title}</span>
                  {notice.detail ? <span className="text-sm text-muted-foreground">{notice.detail}</span> : null}
                </Link>
              ) : (
                <button type="button" onClick={notice.onSelect} className={ROW}>
                  <span className="text-sm font-medium">{notice.title}</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
