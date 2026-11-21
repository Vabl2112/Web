"use client"

import { type ReactNode, useState } from "react"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface FilterPanelProps {
  /** How many filters are set (`filterCount`); shown on the button. */
  active: number
  /** All the filters of the page, for the sheet: links, the select of the order and the search of a city. */
  children: ReactNode
}

/**
 * The filters of a catalog page on a phone, as in the first prototype: an icon button next to the search and a sheet from the bottom with
 * everything in it. From a tablet up there is no button: the page shows its filters itself, where the prototype puts them. A filter is a
 * link or changes the address, so the sheet closes by itself when the address changes.
 */
export function FilterPanel({ active, children }: FilterPanelProps) {
  const search = useSearchParams().toString()
  // The sheet is open for the address it was opened on; another address (a filter was chosen) closes it without an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null)
  return (
    <Sheet open={openedOn === search} onOpenChange={(open) => setOpenedOn(open ? search : null)}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative shrink-0 sm:hidden" aria-label={active > 0 ? `Фильтры, выбрано: ${active}` : "Фильтры"}>
          <SlidersHorizontal aria-hidden className="size-4" />
          {active > 0 ? (
            <span
              aria-hidden
              className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background"
            >
              {active}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      {/* Radix skips links when it looks for the first thing to focus, so by default the search of a city would get the focus and a phone
          would raise its keyboard. The sheet itself takes the focus instead, so a screen reader still lands in the dialog. */}
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto rounded-t-2xl outline-none"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus()
        }}
      >
        <SheetHeader>
          <SheetTitle>Фильтры</SheetTitle>
          <SheetDescription className="sr-only">Выберите категорию, тип, город или порядок списка.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">{children}</div>
      </SheetContent>
    </Sheet>
  )
}
