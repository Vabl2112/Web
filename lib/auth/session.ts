"use client"

import { useCallback } from "react"
import { api } from "@/lib/api/client"
import { ApiError } from "@/lib/api/errors"
import { unwrap, useRead } from "@/lib/api/hooks"
import type { components } from "@/lib/api/schema"

export type Account = components["schemas"]["Account"]

const SESSION_KEY = "session"

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
    await mutate(null, { revalidate: false })
  }, [mutate])
  return {
    account,
    isLoading,
    isGuest: !isLoading && account === null,
    isCreator: account?.roles.includes("CREATOR") ?? false,
    isAdmin: account?.roles.includes("ADMIN") ?? false,
    refresh: () => mutate(),
    signOut,
  }
}
