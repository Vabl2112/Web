"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { FormAlert } from "@/components/auth/form-alert"
import { MessageComposer } from "@/components/messaging/message-composer"
import { expectOk, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useGet } from "@/lib/api/hooks"
import { type Message, conversationsHref, counterpartName, formatMessageTime, lastIncomingSeqOf } from "@/lib/messaging"
import { refreshInbox, useMessages } from "@/lib/messaging-hooks"
import { cn } from "@/lib/utils"

const NEAR_BOTTOM_PX = 240

/**
 * Tells the API that everything of the other side up to the newest message on the screen is read, once the conversation is on the
 * screen. The number goes with the call (`upToSeq`), so a message that arrives meanwhile stays unread until it is shown.
 */
function useMarkRead(conversationId: string, messages: Message[]) {
  const readUpTo = useRef(0)
  useEffect(() => {
    const markRead = () => {
      const newest = lastIncomingSeqOf(messages)
      if (newest <= readUpTo.current || document.visibilityState !== "visible") return
      const previous = readUpTo.current
      readUpTo.current = newest
      expectOk(api.POST("/v1/conversations/{id}/read", { params: { path: { id: conversationId } }, body: { upToSeq: newest } })).then(
        () => refreshInbox(),
        () => {
          readUpTo.current = previous
        },
      )
    }
    markRead()
    document.addEventListener("visibilitychange", markRead)
    return () => document.removeEventListener("visibilitychange", markRead)
  }, [conversationId, messages])
}

/** Keeps the newest message in view: always for the first load and for the person's own message, otherwise only when they are near the end. */
function useScrollToNewest(messages: Message[]) {
  const seen = useRef(0)
  useEffect(() => {
    const newest = messages[messages.length - 1]
    if (newest === undefined || messages.length === seen.current) return
    const first = seen.current === 0
    seen.current = messages.length
    const nearEnd = window.innerHeight + window.scrollY >= document.body.scrollHeight - NEAR_BOTTOM_PX
    if (first || newest.mine || nearEnd) window.scrollTo({ top: document.body.scrollHeight })
  }, [messages])
}

function Bubble({ message }: { message: Message }) {
  return (
    <li className={cn("max-w-[80%] rounded-2xl px-4 py-2", message.mine ? "self-end bg-foreground text-background" : "self-start bg-muted")}>
      {message.listing ? (
        <Link href={`/listings/${message.listing.id}`} className="mb-1 block text-xs underline underline-offset-4">
          О позиции: {message.listing.title}
        </Link>
      ) : null}
      <p className="break-words whitespace-pre-wrap">{message.text}</p>
      <time dateTime={message.createdAt} className="mt-1 block text-xs opacity-70">
        {formatMessageTime(message.createdAt)}
      </time>
    </li>
  )
}

function ThreadBody({ conversationId }: { conversationId: string }) {
  const { data: conversation, error } = useGet(
    `conversation-${conversationId}`,
    () => api.GET("/v1/conversations/{id}", { params: { path: { id: conversationId } } }),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )
  const { messages, status, paused, appendSent } = useMessages(conversationId)
  useMarkRead(conversationId, messages)
  useScrollToNewest(messages)

  const send = async (text: string, clientMessageId: string) => {
    const message = await unwrap(
      api.POST("/v1/conversations/{id}/messages", { params: { path: { id: conversationId } }, body: { text, clientMessageId } }),
    )
    appendSent(message)
    await refreshInbox()
  }

  if (status === "missing" || error?.status === 404 || error?.status === 400) {
    return <FormAlert message="Диалог не найден, или сообщения сейчас недоступны." />
  }
  if (error) return <FormAlert message={errorTextOf(error)} />

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Link href={conversationsHref(conversation?.myRole ?? "BUYER")} className="text-sm text-muted-foreground underline underline-offset-4">
          ← Все диалоги
        </Link>
        {conversation ? (
          <h2 className="text-xl font-semibold">
            {conversation.counterpart.creatorId ? (
              <Link href={`/creators/${conversation.counterpart.creatorId}`} className="underline-offset-4 hover:underline">
                {counterpartName(conversation.counterpart)}
              </Link>
            ) : (
              counterpartName(conversation.counterpart)
            )}
          </h2>
        ) : null}
      </div>
      {conversation?.originListing ? (
        <p className="text-sm text-muted-foreground">
          Разговор начат с позиции{" "}
          <Link href={`/listings/${conversation.originListing.id}`} className="underline underline-offset-4">
            {conversation.originListing.title}
          </Link>
        </p>
      ) : null}
      {status === "failed" ? <FormAlert message="Не удалось загрузить сообщения. Мы попробуем ещё раз." /> : null}
      {paused ? <FormAlert tone="info" message="Автообновление остановлено из-за бездействия. Нажмите на страницу или начните печатать, чтобы продолжить." /> : null}
      {status === "loading" ? <p className="text-sm text-muted-foreground">Загружаем…</p> : null}
      {status === "ready" && messages.length === 0 ? <p className="text-sm text-muted-foreground">Сообщений пока нет.</p> : null}
      <ul aria-live="polite" className="flex flex-col gap-2">
        {messages.map((message) => (
          <Bubble key={message.id} message={message} />
        ))}
      </ul>
      {conversation?.counterpart.deleted ? (
        <FormAlert tone="info" message="Собеседник удалил аккаунт. Писать ему больше нельзя, история переписки остаётся." />
      ) : (
        <MessageComposer onSend={send} />
      )}
    </section>
  )
}

/** One conversation: the messages (read by polling), and the box to answer. The key makes a new conversation start from nothing. */
export function ConversationThread({ conversationId }: { conversationId: string }) {
  return <ThreadBody key={conversationId} conversationId={conversationId} />
}
