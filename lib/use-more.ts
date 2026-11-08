"use client"

import { useCallback, useState } from "react"
import { errorTextOf } from "@/lib/api/errors"
import type { Page } from "@/lib/api/hooks"

/**
 * A list whose first page came from the server (so it is in the HTML) and whose next pages are read in the browser by the cursor.
 * A page that changes its filters is a new address and so a new render: key the component by that address and it starts over.
 */
export function useMore<T>(initial: Page<T>, loadPage: (cursor: string) => Promise<Page<T>>) {
  const [items, setItems] = useState<T[]>(initial.items)
  const [cursor, setCursor] = useState<string | null>(initial.nextCursor ?? null)
  const [loading, setLoading] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const loadMore = useCallback(async () => {
    if (cursor === null || loading) return
    setLoading(true)
    setFailure(null)
    try {
      const page = await loadPage(cursor)
      setItems((current) => [...current, ...page.items])
      setCursor(page.nextCursor ?? null)
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setLoading(false)
    }
  }, [cursor, loading, loadPage])

  return { items, hasMore: cursor !== null, loading, failure, loadMore }
}
