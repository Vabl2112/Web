"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/cabinet", label: "Витрина", exact: true },
  { href: "/cabinet/profile", label: "Профиль", exact: false },
  { href: "/cabinet/listings", label: "Позиции", exact: false },
  { href: "/cabinet/portfolio", label: "Портфолио", exact: false },
]

export function CabinetNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Разделы кабинета" className="flex flex-wrap gap-2 border-b border-border pb-4">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm transition-colors",
              active ? "bg-foreground text-background" : "hover:bg-muted",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
