import useSWR, { type Key, type SWRConfiguration } from "swr"
import useSWRInfinite from "swr/infinite"
import { type Answer, type Page, unwrap } from "./answers"
import type { ApiError } from "./errors"

// The helpers that do not need React live in `answers.ts` (Server Components import them from there); these names stay importable here.
export { type Answer, type Page, expectOk, unwrap } from "./answers"

/** A read by SWR with a fetcher of your own: `key` says what is read (`null` reads nothing). */
export function useRead<T>(key: Key, fetcher: () => Promise<T>, config?: SWRConfiguration<T, ApiError>) {
  return useSWR<T, ApiError>(key, fetcher, config)
}

/** A read by SWR: `load` is a call of the client (`() => api.GET("/v1/...")`), `key` says what is read (`null` reads nothing). */
export function useGet<T>(key: Key, load: () => Promise<Answer<T>>, config?: SWRConfiguration<T, ApiError>) {
  return useRead<T>(key, () => unwrap(load()), config)
}

/** A list read page by page with the cursor of the contract; `loadMore` adds the next page, `hasMore` tells whether there is one. */
export function useCursorList<T>(base: string | null, loadPage: (cursor: string | null) => Promise<Answer<Page<T>>>) {
  const swr = useSWRInfinite<Page<T>, ApiError>(
    (_index, previous) => {
      if (base === null) return null
      if (previous && !previous.nextCursor) return null
      return [base, previous?.nextCursor ?? null]
    },
    ([, cursor]: [string, string | null]) => unwrap(loadPage(cursor)),
  )
  const pages = swr.data ?? []
  const last = pages[pages.length - 1]
  return {
    items: pages.flatMap((page) => page.items),
    error: swr.error,
    isLoading: swr.isLoading,
    isLoadingMore: swr.isValidating && pages.length > 0,
    hasMore: Boolean(last?.nextCursor),
    loadMore: () => swr.setSize(swr.size + 1),
    reload: () => swr.mutate(),
  }
}
