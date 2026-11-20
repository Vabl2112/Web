import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Header } from "@/components/header"
import { SectionNav, type SectionNavItem } from "@/components/section-nav"

// Private: `proxy.ts` sends a guest to the login page, and the API decides who is an administrator; no search engine needs it.
export const metadata: Metadata = { title: "Администрирование — EGG", robots: { index: false } }

const ITEMS: SectionNavItem[] = [
  { href: "/admin/moderation", label: "Модерация" },
  { href: "/admin/metrics", label: "Метрики" },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <SectionNav label="Администрирование" items={ITEMS} />
        {children}
      </main>
    </div>
  )
}
