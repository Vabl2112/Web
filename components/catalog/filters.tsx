import type { ReactNode } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { badgeVariants } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { type CatalogQuery, type Category, LISTING_TYPES, LISTING_TYPE_LABELS, catalogHref } from "@/lib/catalog"
import { cn } from "@/lib/utils"

/**
 * How big a filter is, as on the page of the first prototype it belongs to: `badge` is the small one of the list of masters, `md` the pill of
 * services and goods, `lg` the big pill of the board of pictures.
 */
export type ChipSize = "badge" | "md" | "lg"

interface ChipProps {
  href: string
  active: boolean
  /** The subcategories (amber, as on the board of pictures) instead of the main filters (dark when chosen). */
  sub?: boolean
  size?: ChipSize
  children: ReactNode
}

/** A filter as a link, so that it works without scripts and a filtered page can be shared. */
export function Chip({ href, active, sub = false, size = "lg", children }: ChipProps) {
  const className = sub
    ? cn(
        "rounded-full px-4 py-2 text-sm font-medium transition-all",
        active ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80",
      )
    : size === "badge"
      ? cn(badgeVariants({ variant: active ? "default" : "outline" }), "cursor-pointer")
      : cn(
          "rounded-full text-sm font-medium transition-all",
          size === "md" ? "border px-4 py-2" : "px-5 py-2.5",
          active
            ? cn("bg-foreground text-background", size === "md" && "border-foreground")
            : "border border-border bg-card text-foreground hover:bg-muted",
        )
  return (
    <Link href={href} aria-current={active ? "true" : undefined} className={className}>
      {children}
    </Link>
  )
}

interface CategoryChipsProps {
  categories: Category[]
  basePath: string
  query: CatalogQuery
  size?: ChipSize
  /** Offer the subcategories of the chosen category too (the gallery filters by them). */
  withSubcategories?: boolean
}

/** "All" and every category as links: the filter is in the address, so it works without scripts and a filtered page can be shared. */
export function CategoryChips({ categories, basePath, query, size = "lg", withSubcategories = false }: CategoryChipsProps) {
  const active = categories.find((category) => category.id === query.categoryId)
  const withoutCategory = { ...query, categoryId: undefined, subcategoryId: undefined }
  return (
    <div className="flex flex-col gap-3">
      <nav aria-label="Категории" className="flex flex-wrap gap-2">
        <Chip size={size} href={catalogHref(basePath, withoutCategory)} active={active === undefined}>
          Все
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category.id}
            size={size}
            href={catalogHref(basePath, { ...query, categoryId: category.id, subcategoryId: undefined })}
            active={category.id === active?.id}
          >
            {category.name}
          </Chip>
        ))}
      </nav>
      {withSubcategories && active !== undefined && active.children.length > 0 ? (
        <nav aria-label="Подкатегории" className="flex flex-wrap gap-2">
          <Chip sub href={catalogHref(basePath, { ...query, subcategoryId: undefined })} active={query.subcategoryId === undefined}>
            Все подкатегории
          </Chip>
          {active.children.map((child) => (
            <Chip sub key={child.id} href={catalogHref(basePath, { ...query, subcategoryId: child.id })} active={child.id === query.subcategoryId}>
              {child.name}
            </Chip>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

/** The types of a listing as links, "All" first. */
export function TypeTabs({ basePath, query, size = "md" }: { basePath: string; query: CatalogQuery; size?: ChipSize }) {
  return (
    <nav aria-label="Тип позиции" className="flex flex-wrap gap-2">
      <Chip size={size} href={catalogHref(basePath, { ...query, type: undefined })} active={query.type === undefined}>
        Все
      </Chip>
      {LISTING_TYPES.map((type) => (
        <Chip key={type} size={size} href={catalogHref(basePath, { ...query, type })} active={query.type === type}>
          {LISTING_TYPE_LABELS[type]}
        </Chip>
      ))}
    </nav>
  )
}

interface SearchFormProps {
  action: string
  query: CatalogQuery
  placeholder: string
  /** Called with the text on every change: `LiveSearch` uses it to filter as the person types. Without it the form sends `GET` on Enter. */
  onTextChange?: (text: string) => void
}

/**
 * The search as the first prototype has it: a field with a magnifier and no button. It is still a plain form that sends `GET` on Enter, so
 * it works without scripts, and it keeps the other filters in hidden fields.
 */
/**
 * The filters of the address as hidden fields of a `GET` form, so that a form of one filter (the search, the price) keeps all the others.
 * They are written the way `catalogHref` writes them, so the address after the form is the same as after a link.
 */
export function HiddenFilters({ query }: { query: CatalogQuery }) {
  const search = new URLSearchParams(catalogHref("", query).replace(/^\?/, ""))
  return (
    <>
      {[...search.entries()].map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  )
}

export function SearchForm({ action, query, placeholder, onTextChange }: SearchFormProps) {
  return (
    <form action={action} method="get" role="search" className="relative flex-1 sm:max-w-md">
      <HiddenFilters query={{ ...query, q: undefined }} />
      <Search aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        name="q"
        defaultValue={query.q ?? ""}
        placeholder={placeholder}
        maxLength={100}
        aria-label={placeholder}
        className="pl-10"
        onChange={onTextChange ? (event) => onTextChange(event.target.value) : undefined}
      />
      {/* A plain button, not the one of the design system: its padding would keep the "screen reader only" box from being one pixel. */}
      <button type="submit" className="sr-only">
        Найти
      </button>
    </form>
  )
}
