"use client"

import { mutate } from "swr"
import { api } from "@/lib/api/client"
import { useGet } from "@/lib/api/hooks"

// Every read of the cabinet has a key that starts with `my-`, so one call can refresh them all after a change.
export const PROFILE_KEY = "my-creator-profile"
export const CHECKLIST_KEY = "my-checklist"
export const LISTINGS_KEY = "my-listings"
export const PORTFOLIO_KEY = "my-portfolio"

const QUIET = { shouldRetryOnError: false, revalidateOnFocus: false } as const
const MY_LISTINGS_PAGE = 60

/** The showcase of the signed-in person. `403` is not a failure: this person has no showcase yet (`notCreator`). */
export function useMyProfile() {
  const { data, error, isLoading, mutate: change } = useGet(PROFILE_KEY, () => api.GET("/v1/me/creator-profile"), QUIET)
  return { profile: data, error, isLoading, change, notCreator: error?.status === 403 }
}

export function useChecklist() {
  return useGet(CHECKLIST_KEY, () => api.GET("/v1/me/creator-profile/publication-checklist"), QUIET)
}

export function useCategories() {
  const { data } = useGet("categories", () => api.GET("/v1/categories"), QUIET)
  return data?.items ?? []
}

/** The first page of the listings of the creator; one page is up to 60, far more than a showcase has in the first versions. */
export function useMyListings() {
  return useGet(LISTINGS_KEY, () => api.GET("/v1/me/listings", { params: { query: { limit: MY_LISTINGS_PAGE } } }), QUIET)
}

export function useMyPortfolio() {
  return useGet(PORTFOLIO_KEY, () => api.GET("/v1/me/portfolio-items"), QUIET)
}

/** After any change in the cabinet: reads the showcase, the checklist, the listings and the works again. */
export function refreshCabinet() {
  return mutate((key) => typeof key === "string" && key.startsWith("my-"))
}

export const CALCULATOR_KEY = "my-calculator"

/** The price calculator of the showcase. `404` is not a failure: there is none yet (`none`). */
export function useMyCalculator() {
  const { data, error, isLoading, mutate: change } = useGet(CALCULATOR_KEY, () => api.GET("/v1/me/calculator"), QUIET)
  return { calculator: data, isLoading, change, none: error?.status === 404, error: error?.status === 404 ? undefined : error }
}
