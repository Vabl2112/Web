import type { ReactNode } from "react"
import type { Metadata } from "next"
import { CabinetNav } from "@/components/cabinet/cabinet-nav"
import { Header } from "@/components/header"

// The cabinet is private: no search engine needs it. `proxy.ts` sends a guest to the login page before this renders.
export const metadata: Metadata = { title: "Кабинет — EGG", robots: { index: false } }

export default function CabinetLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
        <h1 className="text-3xl font-bold">Кабинет</h1>
        <CabinetNav />
        {children}
      </main>
    </div>
  )
}
