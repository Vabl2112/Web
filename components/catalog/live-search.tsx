"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { SearchForm } from "@/components/catalog/filters"
import { type CatalogQuery, catalogHref } from "@/lib/catalog"

const PAUSE_MS = 350

interface LiveSearchProps {
  basePath: string
  query: CatalogQuery
  placeholder: string
}

/**
 * The search of a catalog page that filters while the person types, as in the first prototype: a pause after the last key, then the address
 * of the page changes (`q` in the query) and the list is read again. Enter still sends the plain form, so it works without scripts too.
 */
export function LiveSearch({ basePath, query, placeholder }: LiveSearchProps) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  const change = (text: string) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => router.replace(catalogHref(basePath, { ...query, q: text.trim() === "" ? undefined : text.trim() }), { scroll: false }), PAUSE_MS)
  }

  return <SearchForm action={basePath} query={query} placeholder={placeholder} onTextChange={change} />
}
