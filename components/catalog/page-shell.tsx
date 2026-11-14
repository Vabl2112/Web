import type { ReactNode } from "react"
import { Header } from "@/components/header"

interface PageShellProps {
  title: string
  description?: string
  children: ReactNode
}

/** The frame of the catalog pages: the header of the site, the title of the page and the content. */
export function PageShell({ title, description, children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-bold text-balance text-foreground sm:text-3xl">{title}</h1>
          {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </main>
    </div>
  )
}
