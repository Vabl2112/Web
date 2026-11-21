import type { ReactNode } from "react"
import Link from "next/link"
import { Check } from "lucide-react"

interface Point {
  title: string
  text: string
}

interface AuthSplitShellProps {
  /** The title of the dark side. */
  pitch: string
  /** The line under it. */
  pitchText: string
  points: Point[]
  title: string
  description?: string
  /** The line at the top right, such as "Уже есть аккаунт? Войти". */
  aside?: ReactNode
  children: ReactNode
}

/**
 * The frame of the registration page of the first prototype: a dark side on the left with the brand, a line and three points (only on a
 * wide screen), and on the right the logo, the link to the other page, the form in the middle and the links to the documents at the bottom.
 */
export function AuthSplitShell({ pitch, pitchText, points, title, description, aside, children }: AuthSplitShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-1/2 bg-foreground lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-foreground to-foreground/80" />
        <div className="absolute inset-0 opacity-10">
          <svg aria-hidden className="size-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="auth-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-background" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#auth-grid)" />
          </svg>
        </div>
        <div className="relative flex h-full flex-col items-center justify-center p-16 text-background">
          <div className="mb-8">
            <span className="text-6xl font-bold text-amber-500">EGG</span>
          </div>
          <p className="mb-4 text-center text-3xl font-bold">{pitch}</p>
          <p className="mb-12 max-w-md text-center text-lg text-background/70">{pitchText}</p>
          <ul className="space-y-6">
            {points.map((point) => (
              <li key={point.title} className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <Check aria-hidden className="size-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold">{point.title}</p>
                  <p className="text-sm text-background/70">{point.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex w-full flex-col justify-between gap-8 px-6 py-8 lg:w-1/2 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-500">EGG</span>
          </Link>
          {aside ? <div className="text-sm text-muted-foreground">{aside}</div> : null}
        </div>

        <main className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
          </div>
          {children}
        </main>

        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            Условия использования
          </Link>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <Link href="/privacy" className="hover:text-foreground">
            Политика конфиденциальности
          </Link>
        </div>
      </div>
    </div>
  )
}
