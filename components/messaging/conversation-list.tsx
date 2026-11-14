"use client"

import { FormAlert } from "@/components/auth/form-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { errorTextOf } from "@/lib/api/errors"
import { useSession } from "@/lib/auth/session"
import { counterpartName, formatMessageTime, withOlder } from "@/lib/messaging"
import { useConversations, useOlderConversations } from "@/lib/messaging-hooks"

const SNIPPET_LENGTH = 90

const snippetOf = (text: string) => (text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}…` : text)

/**
 * The conversations of the person in the chat window (AC-23): the ones they started as a buyer and, for a creator, the ones that came to
 * the showcase, newest first. A row opens the conversation.
 */
export function ConversationList({ onOpen }: { onOpen(conversationId: string): void }) {
  const { data, error, isLoading } = useConversations()
  const more = useOlderConversations(data)
  const { isCreator } = useSession()
  const items = withOlder(data?.items ?? [], more.older)

  if (error?.status === 404) {
    return (
      <div className="p-6 pr-12">
        <FormAlert message="Сообщения сейчас недоступны." />
      </div>
    )
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border px-4 py-3 pr-12">
        <h2 className="text-lg font-semibold">Сообщения</h2>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {error ? (
          <div className="p-4">
            <FormAlert message={errorTextOf(error)} />
          </div>
        ) : null}
        {isLoading ? <p className="p-4 text-sm text-muted-foreground">Загружаем…</p> : null}
        {data && items.length === 0 && !more.hasMore ? (
          <p className="p-8 text-center text-muted-foreground">
            {isCreator ? "Диалогов пока нет. Здесь появятся сообщения тех, кто напишет вам." : "Диалогов пока нет. Напишите создателю со страницы его витрины."}
          </p>
        ) : null}
        <ul className="divide-y divide-border">
          {items.map((conversation) => (
            <li key={conversation.id}>
              <button
                type="button"
                onClick={() => onOpen(conversation.id)}
                className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
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
              </button>
            </li>
          ))}
        </ul>
        {more.failure ? (
          <div className="p-4">
            <FormAlert message={more.failure} />
          </div>
        ) : null}
        {more.hasMore ? (
          <div className="p-4">
            <Button type="button" variant="outline" disabled={more.loading} onClick={() => void more.loadMore()}>
              {more.loading ? "Загружаем…" : "Показать ещё"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
