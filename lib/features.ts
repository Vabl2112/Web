"use client"

import { api } from "@/lib/api/client"
import { useGet } from "@/lib/api/hooks"
import type { components } from "@/lib/api/schema"

export type Features = components["schemas"]["Features"]

/** While the answer has not come (or failed) every feature counts as off, so no page shows a part that the backend may refuse with `404`. */
const OFF: Features = { messaging: false }

/** The feature flags of the deployed backend (`GET /v1/meta/client-versions`), read once and shared by every component. */
export function useFeatures(): Features {
  const { data } = useGet("features", () => api.GET("/v1/meta/client-versions"), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })
  return data?.features ?? OFF
}
