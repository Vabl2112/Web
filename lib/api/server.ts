import { notFound } from "next/navigation"
import { baseUrl, createApiClient } from "./client"
import { toApiError } from "./errors"
import type { Answer } from "./answers"

/**
 * The client for the Server Components. It calls the backend itself (`EGG_API_INTERNAL_URL`) and sends no cookie of the user, and no
 * answer is cached (D6): a showcase that moderation has just approved shows at once.
 */
export const serverApi = createApiClient({
  baseUrl: baseUrl(),
  version: process.env.NEXT_PUBLIC_EGG_WEB_VERSION ?? "0",
  hooks: { onLogin: () => {}, onOfferLogin: () => {}, onUpgrade: () => {} },
  currentPath: () => ({ pathname: "/", search: "" }),
  fetch: ((input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: "no-store" })) as typeof fetch,
})

/** The data of a call made while a page renders: `404` (and `400`, an id that is not an id) shows the page "not found", any other failure the error page. */
export async function loadOrNotFound<T>(call: Promise<Answer<T>>): Promise<T> {
  const { data, error, response } = await call
  if (response.status === 404 || response.status === 400) notFound()
  if (!response.ok) throw toApiError(response.status, error)
  return data as T
}
