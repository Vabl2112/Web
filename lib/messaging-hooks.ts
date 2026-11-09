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
  cursorAfterSend,
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
  const askNow = useRef<() => void>(() => {})

  /** What a poll brought: the server sends the numbers after `lastSeq` in order and without a gap, so the cursor goes to the last of them. */
  const append = useCallback((incoming: Message[]) => {
    if (incoming.length === 0) return
    lastSeq.current = Math.max(lastSeq.current, lastSeqOf(incoming))
    setMessages((current) => mergeMessages(current, incoming))
  }, [])

  /**
   * The message that the person has just sent: shown at once. The cursor moves to it only when it is the very next number. Otherwise a
   * message of the other side was stored in between, and moving the cursor past it would hide it in this tab for good: the cursor stays,
   * and the next poll fetches both (the sent one is not doubled, the list is merged by number).
   */
  const appendSent = useCallback((sent: Message) => {
    setMessages((current) => mergeMessages(current, [sent]))
    const { cursor, gap } = cursorAfterSend(lastSeq.current, sent.seq)
    lastSeq.current = cursor
    if (gap) askNow.current()
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
    askNow.current = () => poller.refresh()

    async function fetchNew() {
      for (let round = 0; round < MAX_ROUNDS; round += 1) {
        const { data, error, response } = await api.GET("/v1/conversations/{id}/messages", {
          params: { path: { id: conversationId }, query: { after: lastSeq.current } },
        })
        if (cancelled) return
        // 404: no such conversation for this person; 400: the address is not even the id of a conversation. Neither will change by asking again.
        if (response.status === 404 || response.status === 400) {
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
      askNow.current = () => {}
      poller.stop()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onVisibility)
      window.removeEventListener("pointerdown", onAction)
      window.removeEventListener("keydown", onAction)
    }
  }, [conversationId, append])

  return { messages, status, paused, appendSent }
}
