"use client"

import Link from "next/link"
import { FormAlert } from "@/components/auth/form-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { errorTextOf } from "@/lib/api/errors"
import { useSession } from "@/lib/auth/session"
import { type ConversationRole, conversationHref, conversationsHref, counterpartName, formatMessageTime, withOlder } from "@/lib/messaging"
import { useConversations, useOlderConversations } from "@/lib/messaging-hooks"

const SNIPPET_LENGTH = 90

const snippetOf = (text: string) => (text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}…` : text)

/**
 * The conversations of one side: a buyer reads theirs on `/messages`, a creator in the cabinet (AC-23). The API gives both and the list
 * keeps the ones where the person plays this role; a link leads to the other list for a person who plays both.
 */
export function ConversationList({ role }: { role: ConversationRole }) {
  const { data, error, isLoading } = useConversations()
  const more = useOlderConversations(data)
  const { isCreator } = useSession()
  const otherRole: ConversationRole = role === "BUYER" ? "CREATOR" : "BUYER"
  const all = withOlder(data?.items ?? [], more.older)
  const items = all.filter((conversation) => conversation.myRole === role)
  const others = all.filter((conversation) => conversation.myRole === otherRole)
  const unreadElsewhere = others.reduce((sum, conversation) => sum + conversation.unreadCount, 0)
  // A creator may also write to other creators as a buyer, and the other way round; the link is there when there is something to see.
  const showCrossLink = role === "BUYER" ? isCreator : others.length > 0

  if (error?.status === 404) return <FormAlert message="Сообщения сейчас недоступны." />

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">{role === "BUYER" ? "Сообщения" : "Сообщения витрины"}</h2>
      {error ? <FormAlert message={errorTextOf(error)} /> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Загружаем…</p> : null}
      {data && items.length === 0 && !more.hasMore ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {role === "BUYER" ? "Диалогов пока нет. Напишите создателю со страницы его витрины." : "Вам пока никто не писал."}
        </p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {items.map((conversation) => (
          <li key={conversation.id}>
            <Link href={conversationHref(role, conversation.id)} className="flex items-start gap-3 p-4 transition-colors hover:bg-muted">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-medium">{counterpartName(conversation.counterpart)}</span>
                  {conversation.lastMessageAt ? (
                    <time dateTime={conversation.lastMessageAt} className="shrink-0 text-xs text-muted-foreground">
                      {formatMessageTime(conversation.lastMessageAt)}
                    </time>
                  ) : null}
                </div>
                {conversation.lastMessage ? (
                  <p className="truncate text-sm text-muted-foreground">
                    {conversation.lastMessage.mine ? "Вы: " : ""}
                    {snippetOf(conversation.lastMessage.text)}
                  </p>
                ) : null}
              </div>
              {conversation.unreadCount > 0 ? <Badge aria-label={`Непрочитанных: ${conversation.unreadCount}`}>{conversation.unreadCount}</Badge> : null}
            </Link>
          </li>
        ))}
      </ul>
      {more.failure ? <FormAlert message={more.failure} /> : null}
      {more.hasMore ? (
        <Button type="button" variant="outline" className="w-fit" disabled={more.loading} onClick={() => void more.loadMore()}>
          {more.loading ? "Загружаем…" : "Показать ещё"}
        </Button>
      ) : null}
      {showCrossLink ? (
        <Link href={conversationsHref(otherRole)} className="w-fit text-sm text-muted-foreground underline underline-offset-4">
          {role === "BUYER" ? "Сообщения вашей витрины" : "Ваши диалоги как покупателя"}
          {unreadElsewhere > 0 ? ` (непрочитанных: ${unreadElsewhere})` : ""}
        </Link>
      ) : null}
    </section>
  )
}
