import type { ReactNode } from "react"
import Link from "next/link"
import { Check, ChevronDown, ChevronRight, X } from "lucide-react"
import { CityFilter } from "@/components/catalog/city-filter"
import { HiddenFilters } from "@/components/catalog/filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type CatalogQuery, type Category, LISTING_TYPES, catalogHref } from "@/lib/catalog"
import { cn } from "@/lib/utils"

const BASE = "/listings"

/** The names of the types in the filter: the plural, since the filter is a kind of listings, not one listing. */
export const LISTING_TYPE_FILTER_LABELS = {
  SERVICE: "Услуги",
  READY_PRODUCT: "Готовые товары",
  MADE_TO_ORDER: "На заказ",
} as const

const RUBLES = new Intl.NumberFormat("ru-RU")

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

/** What stays when the filters are reset: the way the list is shown and its order. */
function resetQuery(query: CatalogQuery): CatalogQuery {
  return { view: query.view, sort: query.sort }
}

/** How many filters of the panel are set; the search is counted too, since the button "Сбросить" clears it as well. */
export function listingFilterCount(query: CatalogQuery): number {
  const price = query.priceMin !== undefined || query.priceMax !== undefined ? 1 : undefined
  return [query.type, query.categoryId, query.subcategoryId, query.cityId, query.q, price, query.inStock, query.verified].filter(
    (value) => value !== undefined,
  ).length
}

/** The bounds of a price as words: "от 1 000 ₽", "до 5 000 ₽" or "1 000 – 5 000 ₽". */
export function priceRangeText(min: number | undefined, max: number | undefined): string {
  if (min !== undefined && max !== undefined) return `${RUBLES.format(min)} – ${RUBLES.format(max)} ₽`
  return min !== undefined ? `от ${RUBLES.format(min)} ₽` : `до ${RUBLES.format(max ?? 0)} ₽`
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

/** The subcategories of the chosen category, under its row: the branch of the tree. A chosen one takes itself off again. */
function SubcategoryBranch({ category, query }: { category: Category; query: CatalogQuery }) {
  return (
    <ul aria-label={`Подкатегории: ${category.name}`} className="mt-1 ml-4 flex flex-col border-l border-border pl-3">
      {category.children.map((child) => {
        const active = query.subcategoryId === child.id
        return (
          <li key={child.id}>
            <Link
              href={catalogHref(BASE, { ...query, subcategoryId: active ? undefined : child.id })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {child.name}
              {active ? <Check aria-hidden className="size-4 shrink-0" /> : null}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function CategoryRow({ category, query }: { category: Category; query: CatalogQuery }) {
  const active = query.categoryId === category.id
  return (
    <div>
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
      {active && category.children.length > 0 ? <SubcategoryBranch category={category} query={query} /> : null}
    </div>
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

/** The bounds of the price in roubles: a plain `GET` form that keeps every other filter, so it works without scripts too. */
function PriceForm({ query }: { query: CatalogQuery }) {
  return (
    <form action={BASE} method="get" className="flex flex-col gap-2">
      <HiddenFilters query={{ ...query, priceMin: undefined, priceMax: undefined }} />
      <div className="flex items-center gap-2">
        <Input type="number" name="priceMin" min={0} step={1} inputMode="numeric" placeholder="от" aria-label="Цена от, ₽" defaultValue={query.priceMin} />
        <span aria-hidden className="text-muted-foreground">
          –
        </span>
        <Input type="number" name="priceMax" min={0} step={1} inputMode="numeric" placeholder="до" aria-label="Цена до, ₽" defaultValue={query.priceMax} />
      </div>
      <Button type="submit" variant="outline" size="sm">
        Применить
      </Button>
      <p className="text-xs text-muted-foreground">С ценой «по договорённости» в подборку не попадает.</p>
    </form>
  )
}

/** A yes-or-no filter as a link with a box that is ticked when it is on, as the checkboxes of the first web. */
function Toggle({ label, on, href }: { label: string; on: boolean; href: string }) {
  return (
    <Link href={href} role="checkbox" aria-checked={on} className="flex items-center gap-3 py-1.5 text-sm text-foreground hover:text-foreground/80">
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          on ? "border-foreground bg-foreground text-background" : "border-input",
        )}
      >
        {on ? <Check className="size-3" /> : null}
      </span>
      {label}
    </Link>
  )
}

interface ListingFiltersProps {
  categories: Category[]
  query: CatalogQuery
  /** The city in the panel too: on a phone the city button of the header is hidden, so the sheet has the search of a city. */
  withCity?: boolean
}

/**
 * The filters of the services and goods as the sidebar of the first web: the type, the tree of categories (the subcategories open under
 * the chosen one), the price, "Дополнительно" and the reset with the number of what is set. Every filter is in the address, so a filtered
 * page works without scripts and can be shared; a chosen filter takes itself off again. The features of a category are the next step.
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
      <Section title="Цена, ₽">
        <PriceForm query={query} />
      </Section>
      {withCity ? (
        <Section title="Город">
          <CityFilter basePath={BASE} query={query} />
        </Section>
      ) : null}
      <Section title="Дополнительно">
        <div className="flex flex-col">
          <Toggle label="Только в наличии" on={query.inStock === true} href={catalogHref(BASE, { ...query, inStock: query.inStock ? undefined : true })} />
          <Toggle
            label="Проверенные мастера"
            on={query.verified === true}
            href={catalogHref(BASE, { ...query, verified: query.verified ? undefined : true })}
          />
        </div>
      </Section>
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
  const subcategory = category?.children.find((child) => child.id === query.subcategoryId)
  if (subcategory) chips.push({ key: "subcategory", label: subcategory.name, without: { ...query, subcategoryId: undefined } })
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    chips.push({ key: "price", label: priceRangeText(query.priceMin, query.priceMax), without: { ...query, priceMin: undefined, priceMax: undefined } })
  }
  if (query.inStock) chips.push({ key: "inStock", label: "В наличии", without: { ...query, inStock: undefined } })
  if (query.verified) chips.push({ key: "verified", label: "Проверенные мастера", without: { ...query, verified: undefined } })
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
