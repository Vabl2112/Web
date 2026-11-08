import type { ReactNode } from "react"
import type { Metadata } from "next"
import { Header } from "@/components/header"

// Private: `proxy.ts` sends a guest to the login page before this renders, and no search engine needs it.
export const metadata: Metadata = { title: "Сообщения — EGG", robots: { index: false } }

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">{children}</main>
    </div>
  )
}
