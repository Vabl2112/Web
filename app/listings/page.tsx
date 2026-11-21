import type { Metadata } from "next"
import { FilterPanel } from "@/components/catalog/filter-panel"
import { ActiveFilters, ListingFilters, listingFilterCount } from "@/components/catalog/listing-filters"
import { ListingList } from "@/components/catalog/listing-list"
import { LiveSearch } from "@/components/catalog/live-search"
import { PageShell } from "@/components/catalog/page-shell"
import { ListingSortSelect } from "@/components/catalog/sort-select"
import { ViewToggle } from "@/components/catalog/view-toggle"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref, listingsApiQuery, parseCatalogQuery } from "@/lib/catalog"
import { listingCountText } from "@/lib/format"
import type { SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Услуги и товары — EGG" }

/**
 * Services and goods as the page of goods of the first web: the filters in a sidebar on the left (in a sheet below a laptop), the search,
 * the order and the toggle of the view on top, the chips of what is set with the count of what is found, and the cards three on a row.
 * The city is chosen with the button of the header; on a phone, where that button is hidden, it is in the sheet.
 */
export default async function ListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = parseCatalogQuery(await searchParams)
  const [categories, page] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(serverApi.GET("/v1/listings", { params: { query: listingsApiQuery(query) } })),
  ])
  return (
    <PageShell title="Услуги и товары" description="Услуги, готовые вещи и работы на заказ: выберите и напишите мастеру.">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside aria-label="Фильтры" className="hidden w-64 shrink-0 lg:block">
          {/* Sticky, and scrolled by itself when it is taller than the window, so its bottom (the reset) is always reachable. */}
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 pb-4">
            <ListingFilters categories={categories.items} query={query} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-2">
            <LiveSearch basePath="/listings" query={query} placeholder="Поиск услуг и товаров" />
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:block">
                <ListingSortSelect query={query} />
              </div>
              <div className="hidden sm:block">
                <ViewToggle basePath="/listings" query={query} />
              </div>
              <FilterPanel active={listingFilterCount(query)} hiddenFrom="lg">
                <div className="sm:hidden">
                  <ListingSortSelect query={query} className="w-full" />
                </div>
                <ListingFilters categories={categories.items} query={query} withCity />
              </FilterPanel>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ActiveFilters categories={categories.items} query={query} />
            <p className="ml-auto text-sm text-muted-foreground" aria-live="polite">
              Найдено {listingCountText(page.total)}
            </p>
          </div>
          <ListingList key={catalogHref("/listings", query)} initial={page} query={query} withSidebar />
        </div>
      </div>
    </PageShell>
  )
}
