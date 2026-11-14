"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useChat } from "@/components/messaging/chat-provider"
import { badgeText } from "@/components/messaging/messages-link"
import { useSession } from "@/lib/auth/session"
import { useFeatures } from "@/lib/features"
import { useInboxSummary } from "@/lib/messaging-hooks"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/cabinet", label: "Витрина", exact: true },
  { href: "/cabinet/profile", label: "Профиль", exact: false },
  { href: "/cabinet/listings", label: "Позиции", exact: false },
  { href: "/cabinet/portfolio", label: "Портфолио", exact: false },
  { href: "/cabinet/calculator", label: "Калькулятор", exact: false },
]

const ITEM_CLASSES = "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors"

export function CabinetNav() {
  const pathname = usePathname()
  const chat = useChat()
  const { messaging } = useFeatures()
  const { account } = useSession()
  const { data } = useInboxSummary(messaging && account !== null)
  const unread = data?.unreadConversations ?? 0
  return (
    <nav aria-label="Разделы кабинета" className="flex flex-wrap gap-2 border-b border-border pb-4">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(ITEM_CLASSES, active ? "bg-foreground text-background" : "hover:bg-muted")}
          >
            {item.label}
          </Link>
        )
      })}
      {messaging ? (
        // The messages are a window over the page, not a section of the cabinet: this opens it.
        <button type="button" onClick={() => chat.open()} className={cn(ITEM_CLASSES, "hover:bg-muted")}>
          Сообщения
          {unread > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-white">
              {badgeText(unread)}
            </span>
          ) : null}
        </button>
      ) : null}
    </nav>
  )
}
