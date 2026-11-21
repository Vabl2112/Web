import Link from "next/link"
import { LayoutGrid, LayoutList } from "lucide-react"
import { type CatalogQuery, catalogHref } from "@/lib/catalog"
import { cn } from "@/lib/utils"

/** The toggle of the first web between the grid of cards and the list; the choice is in the address, so it stays with every filter. */
export function ViewToggle({ basePath, query }: { basePath: string; query: CatalogQuery }) {
  const options = [
    { view: undefined, label: "Сеткой", icon: LayoutGrid },
    { view: "list" as const, label: "Списком", icon: LayoutList },
  ]
  return (
    <nav aria-label="Вид" className="flex items-center rounded-lg border border-border p-1">
      {options.map(({ view, label, icon: Icon }) => {
        const active = query.view === view
        return (
          <Link
            key={label}
            href={catalogHref(basePath, { ...query, view })}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            scroll={false}
            className={cn(
              "flex size-8 items-center justify-center rounded-md transition-colors",
              active ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon aria-hidden className="size-4" />
          </Link>
        )
      })}
    </nav>
  )
}
