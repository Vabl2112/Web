import type { ReactNode } from "react"
import { Header } from "@/components/header"

interface PageShellProps {
  title: string
  description?: string
  /** What stands between the header and the title: the big opening block of the front page for a guest. */
  hero?: ReactNode
  /** The title is the one heading of the page (`h1`), unless a hero above it has taken that place. */
  titleLevel?: 1 | 2
  children: ReactNode
}

/** The frame of the catalog pages: the header of the site, the title of the page and the content. */
export function PageShell({ title, description, hero, titleLevel = 1, children }: PageShellProps) {
  const Title = titleLevel === 1 ? "h1" : "h2"
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {hero}
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8">
        <div>
          <Title className="text-2xl font-bold text-balance text-foreground sm:text-3xl">{title}</Title>
          {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </main>
    </div>
  )
}
