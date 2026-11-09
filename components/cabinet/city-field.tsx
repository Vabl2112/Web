"use client"

import { cityLabel, CitySearch } from "@/components/catalog/city-search"
import { Button } from "@/components/ui/button"
import type { City } from "@/lib/catalog"

interface CityFieldProps {
  value: City | null
  /** A city is chosen, or `null`: the person took the city away (a showcase or a listing may have none). */
  onChange(city: City | null): void
}

/** The city of a showcase or a listing: the chosen one with buttons to change or remove it, or the search. The city is optional. */
export function CityField({ value, onChange }: CityFieldProps) {
  if (value === null) return <CitySearch onPick={onChange} />
  return <ChosenCity city={value} onChange={onChange} />
}

function ChosenCity({ city, onChange }: { city: City; onChange(city: City | null): void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm leading-none font-medium">Город</span>
      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <span>{cityLabel(city)}</span>
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
          Убрать город
        </Button>
      </div>
      <details className="text-sm">
        <summary className="w-fit cursor-pointer text-muted-foreground underline underline-offset-4">Изменить город</summary>
        <div className="mt-2">
          <CitySearch label="Новый город" onPick={onChange} />
        </div>
      </details>
    </div>
  )
}
