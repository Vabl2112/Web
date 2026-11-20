"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export interface SectionNavItem {
  href: string
  label: string
  /** The item is current only on exactly this address, not on the addresses below it (the first item of a section). */
  exact?: boolean
}

/** The look of one tab: the underline of the showcase tabs of the first prototype, so every row of sections of the site looks the same. */
export function sectionTabClass(active: boolean): string {
  return cn(
    "flex shrink-0 items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors",
    active ? "border-foreground text-foreground" : "border-transparent text-foreground hover:text-foreground/70",
  )
}

interface SectionNavProps {
  /** What the row is called for a screen reader. */
  label: string
  items: SectionNavItem[]
  /** Tabs that are not addresses (the button that opens the chat window), after the links. */
  children?: ReactNode
}

/**
 * The tabs of a part of the site (the cabinet, the administration) as underlined links with the current one marked. Filters are pills
 * (`Chip`), sections are tabs. On a narrow screen the row scrolls sideways instead of breaking into lines.
 */
export function SectionNav({ label, items, children }: SectionNavProps) {
  const pathname = usePathname()
  return (
    <div className="border-b border-border">
      <nav aria-label={label} className="-mb-px flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={sectionTabClass(active)}>
              {item.label}
            </Link>
          )
        })}
        {children}
      </nav>
    </div>
  )
}
