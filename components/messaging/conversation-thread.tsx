"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FormAlert } from "@/components/auth/form-alert"
import { MessageComposer } from "@/components/messaging/message-composer"
import { Button } from "@/components/ui/button"
import { expectOk, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useGet } from "@/lib/api/hooks"
import { type Message, counterpartName, formatMessageTime, lastIncomingSeqOf } from "@/lib/messaging"
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

/**
 * Keeps the newest message in view inside the scrolling box of the window: always for the first load and for the person's own message,
 * otherwise only when they are near the end. Returns the ref for that box.
 */
function useScrollToNewest(messages: Message[]) {
  const box = useRef<HTMLDivElement>(null)
  const seen = useRef(0)
  useEffect(() => {
    const newest = messages[messages.length - 1]
    const scroller = box.current
    if (newest === undefined || scroller === null || messages.length === seen.current) return
    const first = seen.current === 0
    seen.current = messages.length
    const nearEnd = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= NEAR_BOTTOM_PX
    if (first || newest.mine || nearEnd) scroller.scrollTop = scroller.scrollHeight
  }, [messages])
  return box
}

function Bubble({ message, onNavigate }: { message: Message; onNavigate(): void }) {
  return (
    <li className={cn("max-w-[80%] rounded-2xl px-4 py-2", message.mine ? "self-end bg-foreground text-background" : "self-start bg-muted")}>
      {message.listing ? (
        <Link href={`/listings/${message.listing.id}`} onClick={onNavigate} className="mb-1 block text-xs underline underline-offset-4">
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

interface ThreadProps {
  conversationId: string
  /** Back to the list of conversations. */
  onBack(): void
  /** A link of the thread leads to another page: the window gets out of the way. */
  onNavigate(): void
}

function ThreadBody({ conversationId, onBack, onNavigate }: ThreadProps) {
  const { data: conversation, error } = useGet(
    `conversation-${conversationId}`,
    () => api.GET("/v1/conversations/{id}", { params: { path: { id: conversationId } } }),
    { shouldRetryOnError: false, revalidateOnFocus: false },
  )
  const { messages, status, paused, appendSent } = useMessages(conversationId)
  useMarkRead(conversationId, messages)
  const box = useScrollToNewest(messages)

  const send = async (text: string, clientMessageId: string) => {
    const message = await unwrap(
      api.POST("/v1/conversations/{id}/messages", { params: { path: { id: conversationId } }, body: { text, clientMessageId } }),
    )
    appendSent(message)
    await refreshInbox()
  }

  const missing = status === "missing" || error?.status === 404 || error?.status === 400

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-1 border-b border-border py-2 pr-12 pl-2">
        <Button type="button" variant="ghost" size="icon" onClick={onBack} aria-label="Все диалоги">
          <ArrowLeft className="size-5" />
        </Button>
        {conversation ? (
          <h2 className="min-w-0 truncate text-lg font-semibold">
            {conversation.counterpart.creatorId ? (
              <Link href={`/creators/${conversation.counterpart.creatorId}`} onClick={onNavigate} className="underline-offset-4 hover:underline">
                {counterpartName(conversation.counterpart)}
              </Link>
            ) : (
              counterpartName(conversation.counterpart)
            )}
          </h2>
        ) : null}
      </header>
      <div ref={box} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {missing ? <FormAlert message="Диалог не найден, или сообщения сейчас недоступны." /> : null}
        {!missing && error ? <FormAlert message={errorTextOf(error)} /> : null}
        {!missing && !error ? (
          <>
            {conversation?.originListing ? (
              <p className="text-sm text-muted-foreground">
                Разговор начат с позиции{" "}
                <Link href={`/listings/${conversation.originListing.id}`} onClick={onNavigate} className="underline underline-offset-4">
                  {conversation.originListing.title}
                </Link>
              </p>
            ) : null}
            {status === "failed" ? <FormAlert message="Не удалось загрузить сообщения. Мы попробуем ещё раз." /> : null}
            {paused ? (
              <FormAlert tone="info" message="Автообновление остановлено из-за бездействия. Нажмите на окно или начните печатать, чтобы продолжить." />
            ) : null}
            {status === "loading" ? <p className="text-sm text-muted-foreground">Загружаем…</p> : null}
            {status === "ready" && messages.length === 0 ? <p className="text-sm text-muted-foreground">Сообщений пока нет.</p> : null}
            <ul aria-live="polite" className="flex flex-col gap-2">
              {messages.map((message) => (
                <Bubble key={message.id} message={message} onNavigate={onNavigate} />
              ))}
            </ul>
          </>
        ) : null}
      </div>
      {!missing && !error ? (
        <div className="border-t border-border p-3">
          {conversation?.counterpart.deleted ? (
            <FormAlert tone="info" message="Собеседник удалил аккаунт. Писать ему больше нельзя, история переписки остаётся." />
          ) : (
            <MessageComposer onSend={send} />
          )}
        </div>
      ) : null}
    </section>
  )
}

/** One conversation in the chat window: the messages (read by polling), and the box to answer. The key makes a new conversation start from nothing. */
export function ConversationThread(props: ThreadProps) {
  return <ThreadBody key={props.conversationId} {...props} />
}
