"use client"

import Link from "next/link"
import { FormAlert } from "@/components/auth/form-alert"
import { NoAccess } from "@/components/admin/no-access"
import { ShowcaseStatusBadge } from "@/components/cabinet/badges"
import { Chip } from "@/components/catalog/filters"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useGet } from "@/lib/api/hooks"
import { queueKey } from "@/lib/admin-hooks"
import { QUEUE_LABELS, QUEUE_STATES, SLA_HOURS, type ModerationQueueState, formatWaiting, isOverdue, oldestWaiting } from "@/lib/moderation"
import { useNow } from "@/lib/use-now"
import { cn } from "@/lib/utils"

const QUEUE_PAGE = 60

/** One of the three queues of moderation, oldest request in plain view: the team answers within 48 hours. */
export function ModerationQueue({ state }: { state: ModerationQueueState }) {
  const now = useNow()
  const { data, error, isLoading } = useGet(queueKey(state), () => api.GET("/v1/admin/moderation/queue", { params: { query: { state, limit: QUEUE_PAGE } } }), {
    shouldRetryOnError: false,
    revalidateOnFocus: true,
  })

  if (error?.status === 403) return <NoAccess />

  const oldest = data ? oldestWaiting(data.items) : undefined
  return (
    <section className="flex flex-col gap-4">
      <nav aria-label="Очереди" className="flex flex-wrap gap-2">
        {QUEUE_STATES.map((queue) => (
          <Chip key={queue} href={`/admin/moderation?state=${queue}`} active={queue === state}>
            {QUEUE_LABELS[queue]}
          </Chip>
        ))}
      </nav>
      {error ? <FormAlert message={errorTextOf(error)} /> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Загружаем…</p> : null}
      {oldest ? (
        <p className={cn("text-sm", isOverdue(oldest, now) ? "font-medium text-destructive" : "text-muted-foreground")}>
          Самая старая заявка ждёт: {formatWaiting(oldest, now)}
          {isOverdue(oldest, now) ? ` — дольше ${SLA_HOURS} часов` : ""}
        </p>
      ) : null}
      {data && data.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">В этой очереди пусто.</p>
      ) : null}
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {data?.items.map((item) => (
          <li key={item.creatorId}>
            <Link href={`/admin/moderation/${item.creatorId}`} className="flex flex-wrap items-center gap-3 p-4 transition-colors hover:bg-muted">
              <span className="font-medium">{item.displayName ?? "Без названия"}</span>
              {item.category ? <span className="text-sm text-muted-foreground">{item.category.name}</span> : null}
              <ShowcaseStatusBadge status={item.status} />
              {item.pendingContentCount > 0 ? <Badge variant="outline">Материалов: {item.pendingContentCount}</Badge> : null}
              {item.changedSinceReview ? <Badge variant="outline">Текст изменён</Badge> : null}
              <span className={cn("ml-auto text-sm", isOverdue(item.waitingSince, now) ? "font-medium text-destructive" : "text-muted-foreground")}>
                ждёт {formatWaiting(item.waitingSince, now)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
