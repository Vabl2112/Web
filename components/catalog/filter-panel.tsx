"use client"

import { type ReactNode, useState } from "react"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface FilterPanelProps {
  /** How many filters are set (`filterCount`); shown on the button of a phone. */
  active: number
  /** The filters themselves: links and the search of a city. They are in the HTML of the page whatever the screen, so crawlers see them. */
  children: ReactNode
}

/**
 * The filters of a catalog page: in the page itself from a tablet up, and behind the button "Фильтры" in a sheet from the bottom on a
 * phone, as in the first prototype (fourteen categories as pills would take half of the screen). A filter is a link, so the sheet closes by
 * itself when the address changes.
 */
export function FilterPanel({ active, children }: FilterPanelProps) {
  const search = useSearchParams().toString()
  // The sheet is open for the address it was opened on; another address (a filter was chosen) closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  return (
    <>
      <div className="hidden flex-col gap-6 sm:flex">{children}</div>
      <Sheet open={openedOn === search} onOpenChange={(open) => setOpenedOn(open ? search : null)}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-fit gap-2 sm:hidden">
            <SlidersHorizontal aria-hidden className="size-4" />
            Фильтры
            {active > 0 ? <Badge className="h-5 min-w-5 rounded-full px-1.5">{active}</Badge> : null}
          </Button>
        </SheetTrigger>
        {/* Radix skips links when it looks for the first thing to focus, so without this the search of a city would get the focus and a phone would raise its keyboard. */}
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl" onOpenAutoFocus={(event) => event.preventDefault()}>
          <SheetHeader>
            <SheetTitle>Фильтры</SheetTitle>
            <SheetDescription className="sr-only">Выберите категорию, тип, город или порядок списка.</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pb-6">{children}</div>
        </SheetContent>
      </Sheet>
    </>
  )
}
