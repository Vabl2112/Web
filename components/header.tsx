"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, Menu, MessageSquare, X } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { initialsOf } from "@/lib/auth/initials"
import { useSession } from "@/lib/auth/session"
import { useFeatures } from "@/lib/features"

const navLinks = [
  { href: "/masters", label: "Мастера" },
  { href: "/gallery", label: "Фотогалерея" },
  { href: "/services", label: "Услуги" },
  { href: "/products", label: "Товары" },
]

/** The links of the account menu: the cabinet for everybody, the administration only for an administrator (the API checks it again). */
function accountLinks(isAdmin: boolean, messaging: boolean) {
  return [
    { href: "/cabinet", label: "Кабинет" },
    ...(messaging ? [{ href: "/messages", label: "Сообщения" }] : []),
    ...(isAdmin ? [{ href: "/admin/moderation", label: "Модерация" }, { href: "/admin/metrics", label: "Метрики" }] : []),
  ]
}

function GuestButtons() {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Войти</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/register">Регистрация</Link>
      </Button>
    </div>
  )
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { account, isLoading, isAdmin, signOut } = useSession()
  const { messaging } = useFeatures()
  const links = accountLinks(isAdmin, messaging)

  const leave = async () => {
    await signOut()
    setIsOpen(false)
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1">
          <span className="text-2xl font-bold text-amber-500">EGG</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground transition-colors hover:text-foreground/70"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {isLoading ? <div className="hidden size-9 sm:block" aria-hidden /> : null}
          {!isLoading && account === null ? <GuestButtons /> : null}
          {account !== null ? (
            <>
              {messaging ? (
                <Button asChild variant="ghost" size="icon" className="hidden text-muted-foreground sm:flex">
                  <Link href="/messages" aria-label="Сообщения">
                    <MessageSquare className="size-5" />
                  </Link>
                </Button>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden items-center gap-2 px-2 sm:flex" aria-label="Меню аккаунта">
                    <Avatar className="size-9">
                      <AvatarFallback>{initialsOf(account.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate text-sm font-medium lg:inline-block">{account.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{account.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {links.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={leave}>
                    <LogOut className="size-4" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : null}

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Открыть меню</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs p-0">
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <span className="text-lg font-semibold">Меню</span>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon">
                      <X className="size-5" />
                      <span className="sr-only">Закрыть меню</span>
                    </Button>
                  </SheetClose>
                </div>

                {account !== null ? (
                  <div className="flex items-center gap-3 border-b border-border p-4">
                    <Avatar className="size-12">
                      <AvatarFallback>{initialsOf(account.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{account.name}</p>
                      <p className="truncate text-sm text-muted-foreground">{account.email}</p>
                    </div>
                  </div>
                ) : null}

                {/* Mobile Navigation */}
                <nav className="flex flex-col p-4">
                  {[...navLinks, ...(account !== null ? links : [])].map((link) => (
                    <SheetClose key={link.href} asChild>
                      <Link
                        href={link.href}
                        className="flex items-center py-3 text-base font-medium text-foreground transition-colors hover:text-foreground/70"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>

                {/* Mobile Actions */}
                <div className="mt-auto flex flex-col gap-2 border-t border-border p-4">
                  {account !== null ? (
                    <Button variant="outline" onClick={leave}>
                      <LogOut className="size-4" />
                      Выйти
                    </Button>
                  ) : null}
                  {!isLoading && account === null ? (
                    <>
                      <SheetClose asChild>
                        <Button asChild variant="outline">
                          <Link href="/login">Войти</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button asChild>
                          <Link href="/register">Регистрация</Link>
                        </Button>
                      </SheetClose>
                    </>
                  ) : null}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
