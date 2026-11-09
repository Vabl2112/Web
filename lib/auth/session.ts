"use client"

import { useCallback } from "react"
import { mutate as mutateAll } from "swr"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import { unwrap, useRead } from "@/lib/api/hooks"
import type { components } from "@/lib/api/schema"

export type Account = components["schemas"]["Account"]

const SESSION_KEY = "session"

/**
 * What was read for everybody and says nothing about a person: the features of the backend, the categories, the cities found by a text.
 * Every other key of the cache belongs to the person who was here (the session, conversations, counters, the cabinet, the administration).
 */
export function isPublicKey(key: unknown): boolean {
  return typeof key === "string" && (key === "features" || key === "categories" || key.startsWith("cities-"))
}

/**
 * Forgets everything that was read for the person who was here. Another person may sign in on this device next, in the same tab and
 * without a reload, and must never see a trace of the last one. What is public stays: without it (the features of the backend) the page
 * would not know what it may show until the next read, and nothing reads again by itself.
 */
export function forgetEverything() {
  return mutateAll((key) => !isPublicKey(key), undefined, { revalidate: false })
}

/** The signed-in account, or `null` for a guest: `401` from `GET /v1/me` is not an error, it is the answer "nobody". */
export async function loadSession(): Promise<Account | null> {
  try {
    return await unwrap(api.GET("/v1/me"))
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

/** The state of the session for the header and the pages: who is signed in (if anybody) and what they may open. */
export function useSession() {
  const { data, isLoading, mutate } = useRead<Account | null>(SESSION_KEY, loadSession, {
    shouldRetryOnError: false,
    revalidateOnFocus: true,
  })
  const account = data ?? null
  const signOut = useCallback(async () => {
    await api.POST("/v1/auth/logout")
    await forgetEverything()
    await mutate(null, { revalidate: false })
  }, [mutate])
  return {
    account,
    isLoading,
    isGuest: !isLoading && account === null,
    isCreator: account?.roles.includes("CREATOR") ?? false,
    isAdmin: account?.roles.includes("ADMIN") ?? false,
    refresh: () => mutate(),
    /** Right after a successful login: the account is known from its answer, no second call is needed. */
    signedIn: async (signed: Account) => {
      await forgetEverything()
      return mutate(signed, { revalidate: false })
    },
    signOut,
  }
}
