import { toApiError } from "./errors"

// Nothing here needs React, so Server Components may import it (the SWR hooks of `hooks.ts` may not be imported on the server).

/** What a call of the client of the API gives back. */
export interface Answer<T> {
  data?: T
  error?: unknown
  response: Response
}

/** One page of a list: the items and the cursor of the next page (`null` on the last one). */
export interface Page<T> {
  items: T[]
  nextCursor?: string | null
}

/** Turns the answer of a call into its data, or throws an `ApiError`, which is what SWR wants from a fetcher. */
export async function unwrap<T>(call: Promise<Answer<T>>): Promise<T> {
  const { data, error, response } = await call
  if (!response.ok) throw toApiError(response.status, error)
  return data as T
}

/** Like `unwrap` for an answer that has no body (`202`, `204`): throws an `ApiError` when the call failed. */
export async function expectOk(call: Promise<Answer<unknown>>): Promise<void> {
  const { error, response } = await call
  if (!response.ok) throw toApiError(response.status, error)
}
