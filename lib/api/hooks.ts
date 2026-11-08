import useSWR, { type Key, type SWRConfiguration } from "swr"
import { type Answer, unwrap } from "./answers"
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
