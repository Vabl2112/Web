import type { ReactNode } from "react"
import Link from "next/link"
import { Check, ChevronDown, ChevronRight, X } from "lucide-react"
import { CityFilter } from "@/components/catalog/city-filter"
import { type CatalogQuery, type Category, LISTING_TYPES, catalogHref } from "@/lib/catalog"
import { cn } from "@/lib/utils"

const BASE = "/listings"

/** The names of the types in the filter: the plural, since the filter is a kind of listings, not one listing. */
export const LISTING_TYPE_FILTER_LABELS = {
  SERVICE: "Услуги",
  READY_PRODUCT: "Готовые товары",
  MADE_TO_ORDER: "На заказ",
} as const

/**
 * A section of the filters as in the first web: the title in capitals with a chevron, open by default. It is a `<details>`, so it folds
 * without scripts and a screen reader knows it as one.
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group">
      <summary className="flex cursor-pointer list-none items-center justify-between py-2 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{title}</span>
        <ChevronDown aria-hidden className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pt-2">{children}</div>
    </details>
  )
}

/** What stays when the filters are reset: the way the list is shown. */
function resetQuery(query: CatalogQuery): CatalogQuery {
  return { view: query.view }
}

/** How many filters of the panel are set; the search is counted too, since the button "Сбросить" clears it as well. */
export function listingFilterCount(query: CatalogQuery): number {
  return [query.type, query.categoryId, query.cityId, query.q].filter((value) => value !== undefined).length
}

function TypeOptions({ query }: { query: CatalogQuery }) {
  return (
    <nav aria-label="Тип" className="flex flex-wrap gap-2">
      {LISTING_TYPES.map((type) => {
        const active = query.type === type
        return (
          <Link
            key={type}
            href={catalogHref(BASE, { ...query, type: active ? undefined : type })}
            aria-current={active ? "true" : undefined}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors",
              active ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground/30",
            )}
          >
            {active ? <Check aria-hidden className="size-3" /> : null}
            {LISTING_TYPE_FILTER_LABELS[type]}
          </Link>
        )
      })}
    </nav>
  )
}

/** How many categories stand in the column before "Показать ещё": the first web had five, the catalog has twelve. */
export const VISIBLE_CATEGORIES = 7

function CategoryRow({ category, query }: { category: Category; query: CatalogQuery }) {
  const active = query.categoryId === category.id
  return (
    <Link
      href={catalogHref(BASE, { ...query, categoryId: active ? undefined : category.id, subcategoryId: undefined })}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left transition-all",
        active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground hover:border-foreground/30",
      )}
    >
      <span className="font-medium">{category.name}</span>
      {active ? <X aria-hidden className="size-4 shrink-0" /> : <ChevronRight aria-hidden className="size-4 shrink-0" />}
    </Link>
  )
}

/** The categories as rows; the ones after the first few fold under "Показать ещё", and stay open when the chosen one is among them. */
function CategoryRows({ categories, query }: { categories: Category[]; query: CatalogQuery }) {
  const shown = categories.slice(0, VISIBLE_CATEGORIES)
  const rest = categories.slice(VISIBLE_CATEGORIES)
  return (
    <nav aria-label="Категории" className="flex flex-col gap-2">
      {shown.map((category) => (
        <CategoryRow key={category.id} category={category} query={query} />
      ))}
      {rest.length > 0 ? (
        <details open={rest.some((category) => category.id === query.categoryId)} className="group/more flex flex-col">
          <summary className="flex cursor-pointer list-none items-center gap-1 py-1 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span className="group-open/more:hidden">Показать ещё {rest.length}</span>
            <span className="hidden group-open/more:inline">Свернуть</span>
            <ChevronDown aria-hidden className="size-4 transition-transform group-open/more:rotate-180" />
          </summary>
          <div className="mt-2 flex flex-col gap-2">
            {rest.map((category) => (
              <CategoryRow key={category.id} category={category} query={query} />
            ))}
          </div>
        </details>
      ) : null}
    </nav>
  )
}

interface ListingFiltersProps {
  categories: Category[]
  query: CatalogQuery
  /** The city in the panel too: on a phone the city button of the header is hidden, so the sheet has the search of a city. */
  withCity?: boolean
}

/**
 * The filters of the services and goods as the sidebar of the first web: the type, the categories as rows with a chevron, and the reset
 * with the number of what is set. Every filter is a link, so a filtered page works without scripts and can be shared; a chosen filter
 * is a link that takes it off again. The first web also had a price, the availability and the features of a category: the API cannot
 * filter by them yet.
 */
export function ListingFilters({ categories, query, withCity = false }: ListingFiltersProps) {
  const count = listingFilterCount(query)
  return (
    <div className="flex flex-col gap-6">
      <Section title="Тип">
        <TypeOptions query={query} />
      </Section>
      <Section title="Категории">
        <CategoryRows categories={categories} query={query} />
      </Section>
      {withCity ? (
        <Section title="Город">
          <CityFilter basePath={BASE} query={query} />
        </Section>
      ) : null}
      {count > 0 ? (
        <Link
          href={catalogHref(BASE, resetQuery(query))}
          className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium shadow-xs transition-colors hover:bg-muted"
        >
          <X aria-hidden className="size-4" />
          Сбросить фильтры ({count})
        </Link>
      ) : null}
    </div>
  )
}

interface ActiveChip {
  key: string
  label: string
  without: CatalogQuery
}

/** The filters that are set, each with the address without it. */
export function activeChipsOf(categories: Category[], query: CatalogQuery): ActiveChip[] {
  const chips: ActiveChip[] = []
  if (query.type) chips.push({ key: "type", label: LISTING_TYPE_FILTER_LABELS[query.type], without: { ...query, type: undefined } })
  const category = categories.find((candidate) => candidate.id === query.categoryId)
  if (category) chips.push({ key: "category", label: category.name, without: { ...query, categoryId: undefined, subcategoryId: undefined } })
  if (query.cityId) chips.push({ key: "city", label: query.cityName ?? "Город", without: { ...query, cityId: undefined, cityName: undefined } })
  if (query.q) chips.push({ key: "q", label: `«${query.q}»`, without: { ...query, q: undefined } })
  return chips
}

/** The chips of the filters that are set, as in the first web: each with a cross, and "Сбросить все" when there are several. */
export function ActiveFilters({ categories, query }: { categories: Category[]; query: CatalogQuery }) {
  const chips = activeChipsOf(categories, query)
  if (chips.length === 0) return null
  return (
    <ul aria-label="Выбранные фильтры" className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <Link
            href={catalogHref(BASE, chip.without)}
            aria-label={`Убрать фильтр: ${chip.label}`}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/70"
          >
            {chip.label}
            <X aria-hidden className="size-3" />
          </Link>
        </li>
      ))}
      {chips.length > 1 ? (
        <li>
          <Link href={catalogHref(BASE, resetQuery(query))} className="px-2 text-xs text-muted-foreground hover:text-foreground">
            Сбросить все
          </Link>
        </li>
      ) : null}
    </ul>
  )
}
