"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { mutate } from "swr"
import { api } from "@/lib/api/client"
import { toApiError } from "@/lib/api/errors"
import { useGet } from "@/lib/api/hooks"
import {
  IDLE_LIMIT_MS,
  INBOX_INTERVAL_MS,
  type Message,
  POLL_INTERVAL_MS,
  POLL_JITTER_MS,
  lastSeqOf,
  mergeMessages,
} from "@/lib/messaging"
import { Poller } from "@/lib/poller"

export const INBOX_KEY = "inbox-summary"
export const CONVERSATIONS_KEY = "conversations"

const MAX_ROUNDS = 20
const QUIET = { shouldRetryOnError: false, revalidateOnFocus: true, refreshWhenHidden: false } as const
const LIST_PAGE = 60

/** The counters for the badge, read every 30 s while the tab is visible (AC-23). `enabled` is off for a guest and while messaging is off. */
export function useInboxSummary(enabled: boolean) {
  return useGet(enabled ? INBOX_KEY : null, () => api.GET("/v1/me/inbox/summary"), { ...QUIET, refreshInterval: INBOX_INTERVAL_MS })
}

/** The conversations of the signed-in person, both as a buyer and as a creator; the lists filter them by `myRole`. */
export function useConversations() {
  return useGet(CONVERSATIONS_KEY, () => api.GET("/v1/conversations", { params: { query: { limit: LIST_PAGE } } }), {
    ...QUIET,
    refreshInterval: INBOX_INTERVAL_MS,
  })
}

/** After a message was read or sent: reads the badge and the list again. */
export function refreshInbox() {
  return mutate((key) => key === INBOX_KEY || key === CONVERSATIONS_KEY)
}

export type MessagesStatus = "loading" | "ready" | "missing" | "failed"

/**
 * The messages of one conversation: the first read, then the rhythm of `Poller` (5 s while the tab is visible, none while hidden, a
 * stop after 15 min without an action). Each round asks only for what is after the last `seq` we have; no news is an immediate `304`.
 * Use it under a `key` of the conversation id, so another conversation starts from nothing.
 */
export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<MessagesStatus>("loading")
  const [paused, setPaused] = useState(false)
  const lastSeq = useRef(0)

  const append = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return
    lastSeq.current = Math.max(lastSeq.current, lastSeqOf(incoming))
    setMessages((current) => mergeMessages(current, incoming))
  }, [])

  useEffect(() => {
    let cancelled = false
    let missing = false
    lastSeq.current = 0

    const poller: Poller = new Poller({
      poll: fetchNew,
      isVisible: () => document.visibilityState === "visible",
      now: () => Date.now(),
      random: () => Math.random(),
      intervalMs: POLL_INTERVAL_MS,
      jitterMs: POLL_JITTER_MS,
      idleLimitMs: IDLE_LIMIT_MS,
      onIdle: () => setPaused(true),
      onResume: () => setPaused(false),
    })

    async function fetchNew() {
      for (let round = 0; round < MAX_ROUNDS; round += 1) {
        const { data, error, response } = await api.GET("/v1/conversations/{id}/messages", {
          params: { path: { id: conversationId }, query: { after: lastSeq.current } },
        })
        if (cancelled) return
        if (response.status === 404) {
          missing = true
          poller.stop()
          return setStatus("missing")
        }
        if (response.status !== 304 && !response.ok) throw toApiError(response.status, error)
        setStatus("ready")
        if (response.status === 304 || data === undefined) return
        append(data.items)
        if (!data.hasMore || data.items.length === 0) return
      }
    }

    const onVisibility = () => poller.visibilityChanged()
    const onAction = () => poller.touch()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onVisibility)
    window.addEventListener("pointerdown", onAction)
    window.addEventListener("keydown", onAction)

    fetchNew()
      .catch(() => !cancelled && setStatus("failed"))
      .finally(() => !cancelled && !missing && poller.start())

    return () => {
      cancelled = true
      poller.stop()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onVisibility)
      window.removeEventListener("pointerdown", onAction)
      window.removeEventListener("keydown", onAction)
    }
  }, [conversationId, append])

  return { messages, status, paused, append }
}
