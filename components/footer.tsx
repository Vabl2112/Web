import Link from "next/link"

const COLUMNS = [
  {
    title: "Каталог",
    links: [
      { href: "/creators", label: "Мастера" },
      { href: "/gallery", label: "Фотогалерея" },
      { href: "/listings", label: "Услуги и товары" },
    ],
  },
  {
    title: "Аккаунт",
    links: [
      { href: "/register", label: "Регистрация" },
      { href: "/login", label: "Вход" },
    ],
  },
  {
    title: "Документы",
    links: [
      { href: "/terms", label: "Условия использования" },
      { href: "/privacy", label: "Политика конфиденциальности" },
    ],
  },
]

/**
 * The footer of the first front page: the brand with a line about EGG and the columns of links. The first one also had an address, a
 * phone, social links and a subscription form that were only drawn; only the pages that exist are here.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <span className="text-3xl font-bold text-amber-500">EGG</span>
            </Link>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Маркетплейс для творческих людей. Находите мастеров, смотрите их работы и договаривайтесь напрямую — или покажите свои.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-4 font-semibold">{column.title}</h2>
              <ul className="space-y-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="inline-block py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} EGG</p>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Условия использования
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Конфиденциальность
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
