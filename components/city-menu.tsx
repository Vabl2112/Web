"use client"

import { Suspense, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MapPin } from "lucide-react"
import { CitySearch } from "@/components/catalog/city-search"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { type City, catalogHref, parseCatalogQuery } from "@/lib/catalog"

/** The pages that filter by a city; the others send the person to the list of masters of the chosen city. */
const CITY_PAGES = ["/creators", "/listings"]

const TRIGGER = "hidden gap-2 rounded-full sm:flex"

function CityButton() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [open, setOpen] = useState(false)
  const onCityPage = CITY_PAGES.includes(pathname)
  const query = onCityPage ? parseCatalogQuery(Object.fromEntries(params)) : {}
  const target = onCityPage ? pathname : "/creators"

  const choose = (city: City | null) => {
    setOpen(false)
    router.push(catalogHref(target, { ...query, cityId: city?.id, cityName: city?.name }))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={TRIGGER} aria-label="Выбрать город">
          <MapPin className="size-4" />
          <span className="max-w-32 truncate">{query.cityName ?? "Все города"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <CitySearch label="Город" onPick={choose} />
        {query.cityId ? (
          <Button type="button" variant="link" className="mt-2 h-auto p-0" onClick={() => choose(null)}>
            Показать все города
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

/**
 * The button of the city next to the logo, as in the first prototype. The choice is the address of the catalog (`cityId` in the query),
 * the same filter the pages have, so it can be shared and nothing hides on its own: the button shows the city of the page you are on.
 */
export function CityMenu() {
  return (
    <Suspense
      fallback={
        <Button variant="outline" size="sm" className={TRIGGER} disabled>
          <MapPin className="size-4" />
          Все города
        </Button>
      }
    >
      <CityButton />
    </Suspense>
  )
}
