import type { ReactNode } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"

// Private: `proxy.ts` sends a guest to the login page, and the API decides who is an administrator; no search engine needs it.
export const metadata: Metadata = { title: "Администрирование — EGG", robots: { index: false } }

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <nav aria-label="Администрирование" className="flex gap-4 border-b border-border pb-4 text-sm">
          <Link href="/admin/moderation" className="font-medium underline-offset-4 hover:underline">
            Модерация
          </Link>
          <Link href="/admin/metrics" className="font-medium underline-offset-4 hover:underline">
            Метрики
          </Link>
        </nav>
        {children}
      </main>
    </div>
  )
}
