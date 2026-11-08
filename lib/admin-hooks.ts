"use client"

import { mutate } from "swr"

/** Every read of the administration has a key that starts with `admin-`, so one call refreshes the queues and the open showcase after a decision. */
export const ADMIN_PREFIX = "admin-"

export const queueKey = (state: string) => `${ADMIN_PREFIX}queue-${state}`
export const creatorKey = (id: string) => `${ADMIN_PREFIX}creator-${id}`

export function refreshAdmin() {
  return mutate((key) => typeof key === "string" && key.startsWith(ADMIN_PREFIX))
}
