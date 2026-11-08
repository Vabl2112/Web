import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type CatalogQuery, type Category, LISTING_TYPES, LISTING_TYPE_LABELS, catalogHref } from "@/lib/catalog"
import { cn } from "@/lib/utils"

export function Chip({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm transition-colors",
        active ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted",
      )}
    >
      {children}
    </Link>
  )
}

interface CategoryChipsProps {
  categories: Category[]
  basePath: string
  query: CatalogQuery
  /** Offer the subcategories of the chosen category too (the gallery filters by them). */
  withSubcategories?: boolean
}

/** "All" and every category as links: the filter is in the address, so it works without scripts and a filtered page can be shared. */
export function CategoryChips({ categories, basePath, query, withSubcategories = false }: CategoryChipsProps) {
  const active = categories.find((category) => category.id === query.categoryId)
  const withoutCategory = { ...query, categoryId: undefined, subcategoryId: undefined }
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Категории" className="flex flex-wrap gap-2">
        <Chip href={catalogHref(basePath, withoutCategory)} active={active === undefined}>
          Все
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.id}
            href={catalogHref(basePath, { ...query, categoryId: category.id, subcategoryId: undefined })}
            active={category.id === active?.id}
          >
            {category.name}
          </Chip>
        ))}
      </nav>
      {withSubcategories && active !== undefined && active.children.length > 0 ? (
        <nav aria-label="Подкатегории" className="flex flex-wrap gap-2">
          <Chip href={catalogHref(basePath, { ...query, subcategoryId: undefined })} active={query.subcategoryId === undefined}>
            Все подкатегории
          </Chip>
          {active.children.map((child) => (
            <Chip key={child.id} href={catalogHref(basePath, { ...query, subcategoryId: child.id })} active={child.id === query.subcategoryId}>
              {child.name}
            </Chip>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

/** The types of a listing as links, "All" first. */
export function TypeTabs({ basePath, query }: { basePath: string; query: CatalogQuery }) {
  return (
    <nav aria-label="Тип позиции" className="flex flex-wrap gap-2">
      <Chip href={catalogHref(basePath, { ...query, type: undefined })} active={query.type === undefined}>
        Все
      </Chip>
      {LISTING_TYPES.map((type) => (
        <Chip key={type} href={catalogHref(basePath, { ...query, type })} active={query.type === type}>
          {LISTING_TYPE_LABELS[type]}
        </Chip>
      ))}
    </nav>
  )
}

/** The search as a plain form that sends `GET`: it works without scripts and keeps the other filters in hidden fields. */
export function SearchForm({ action, query, placeholder }: { action: string; query: CatalogQuery; placeholder: string }) {
  return (
    <form action={action} method="get" role="search" className="flex max-w-xl gap-2">
      {query.categoryId ? <input type="hidden" name="categoryId" value={query.categoryId} /> : null}
      {query.type ? <input type="hidden" name="type" value={query.type} /> : null}
      <Input type="search" name="q" defaultValue={query.q ?? ""} placeholder={placeholder} maxLength={100} aria-label={placeholder} />
      <Button type="submit">Найти</Button>
    </form>
  )
}
