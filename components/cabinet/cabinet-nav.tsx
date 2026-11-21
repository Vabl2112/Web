"use client"

import { useChat } from "@/components/messaging/chat-provider"
import { badgeText } from "@/components/messaging/messages-link"
import { SectionNav, type SectionNavItem, sectionTabClass } from "@/components/section-nav"
import { useSession } from "@/lib/auth/session"
import { useFeatures } from "@/lib/features"
import { useInboxSummary } from "@/lib/messaging-hooks"

const ITEMS: SectionNavItem[] = [
  { href: "/cabinet", label: "Витрина", exact: true },
  { href: "/cabinet/profile", label: "Профиль" },
  { href: "/cabinet/listings", label: "Позиции" },
  { href: "/cabinet/portfolio", label: "Портфолио" },
  { href: "/cabinet/calculator", label: "Калькулятор" },
  { href: "/cabinet/account", label: "Аккаунт" },
]

export function CabinetNav() {
  const chat = useChat()
  const { messaging } = useFeatures()
  const { account } = useSession()
  const { data } = useInboxSummary(messaging && account !== null)
  const unread = data?.unreadConversations ?? 0
  return (
    <SectionNav label="Разделы кабинета" items={ITEMS}>
      {messaging ? (
        // The messages are a window over the page, not a section of the cabinet: this opens it.
        <button type="button" onClick={() => chat.open()} className={sectionTabClass(false)}>
          Сообщения
          {unread > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-white">
              {badgeText(unread)}
            </span>
          ) : null}
        </button>
      ) : null}
    </SectionNav>
  )
}
