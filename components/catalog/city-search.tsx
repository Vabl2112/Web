"use client"

import { useId, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api/client"
import { useGet } from "@/lib/api/hooks"
import type { City } from "@/lib/catalog"
import { useDebounced } from "@/lib/use-debounced"

const MIN_LETTERS = 2
const PAUSE_MS = 250
const RESULTS = 8

/** "Казань, Татарстан": the name of a city with its region when the data has one. */
export function cityLabel(city: Pick<City, "name" | "region">): string {
  return city.region ? `${city.name}, ${city.region}` : city.name
}

/** A search of cities by the beginning or a fragment of the name (`GET /v1/cities?q=`); the person picks one from the list. */
export function CitySearch({ label = "Город", onPick }: { label?: string; onPick(city: City): void }) {
  const id = useId()
  const [text, setText] = useState("")
  const settled = useDebounced(text.trim(), PAUSE_MS)
  const ready = settled.length >= MIN_LETTERS
  const { data } = useGet(ready ? `cities-${settled}` : null, () => api.GET("/v1/cities", { params: { query: { q: settled, limit: RESULTS } } }), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={text} onChange={(event) => setText(event.target.value)} placeholder="Начните вводить название" autoComplete="off" />
      {ready && data ? (
        data.items.length > 0 ? (
          <ul className="flex flex-col rounded-md border border-border">
            {data.items.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => {
                    setText("")
                    onPick(city)
                  }}
                >
                  {cityLabel(city)}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Такого города нет в списке.</p>
        )
      ) : null}
    </div>
  )
}
