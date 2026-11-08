import type { ReactNode } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AuthShellProps {
  title: string
  description?: string
  children: ReactNode
}

/** The frame of the pages of sign-in, registration and the letters: the header of the site and one card in the middle. */
export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-md flex-col px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle role="heading" aria-level={1} className="text-2xl">
              {title}
            </CardTitle>
            {description ? <CardDescription>{description}</CardDescription> : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-6">{children}</CardContent>
        </Card>
      </main>
    </div>
  )
}
