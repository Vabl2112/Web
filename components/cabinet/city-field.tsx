"use client"

import { cityLabel, CitySearch } from "@/components/catalog/city-search"
import type { City } from "@/lib/catalog"

interface CityFieldProps {
  value: City | null
  onChange(city: City): void
}

/** The city of a showcase or a listing: the chosen one with a button to change it, or the search. The city is optional. */
export function CityField({ value, onChange }: CityFieldProps) {
  if (value === null) return <CitySearch onPick={onChange} />
  return <ChosenCity city={value} onChange={onChange} />
}

function ChosenCity({ city, onChange }: { city: City; onChange(city: City): void }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm leading-none font-medium">Город</span>
      <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
        <span>{cityLabel(city)}</span>
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
