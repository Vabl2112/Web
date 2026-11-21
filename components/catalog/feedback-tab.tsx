"use client"

import { useRouter } from "next/navigation"
import { mutate as mutateGlobal } from "swr"
import useSWRInfinite from "swr/infinite"
import { FeedbackForm, mineKey, useMyFeedback } from "@/components/catalog/feedback-form"
import { FeedbackItem } from "@/components/catalog/feedback-list"
import { EmptyState, MoreButton } from "@/components/catalog/more-button"
import { type Page, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useSession } from "@/lib/auth/session"
import type { Feedback } from "@/lib/catalog"

type FeedbackKey = readonly ["feedback", string, string]

/**
 * The tab "Отзывы" of a showcase: the form for the person (or what stands in its place), and the feedback newest first, read in the
 * browser page by page. After a change the list, the form and the page (its stars come from the server) are read again.
 */
export function FeedbackTab({ creatorId }: { creatorId: string }) {
  const router = useRouter()
  const { isAdmin } = useSession()
  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<Page<Feedback>, Error, (index: number, previous: Page<Feedback> | null) => FeedbackKey | null>(
    (index, previous) => (previous && !previous.nextCursor ? null : ["feedback", creatorId, index === 0 ? "" : (previous?.nextCursor ?? "")]),
    ([, id, cursor]) => unwrap(api.GET("/v1/creators/{id}/feedback", { params: { path: { id }, query: { cursor: cursor === "" ? undefined : cursor } } })),
    { revalidateFirstPage: false, shouldRetryOnError: false, revalidateOnFocus: false },
  )
  const items = data?.flatMap((page) => page.items) ?? []
  // The person's own feedback stands in the card above ("Ваш отзыв", with its button to delete); the list is the others'.
  const { data: mine } = useMyFeedback(creatorId)
  const others = items.filter((item) => item.id !== mine?.feedback?.id)
  const last = data?.[data.length - 1]
  const loadingMore = isLoading || (size > (data?.length ?? 0) && data !== undefined)

  const changed = async () => {
    await mutate()
    await mutateGlobal(mineKey(creatorId))
    router.refresh()
  }

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <FeedbackForm creatorId={creatorId} onChanged={() => void changed()} />
      {error ? <p role="alert" className="text-sm text-destructive">{errorTextOf(error)}</p> : null}
      {data && items.length === 0 ? <EmptyState>Пока нет отзывов.</EmptyState> : null}
      {others.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {others.map((item) => (
            <FeedbackItem key={item.id} feedback={item} canDelete={isAdmin} onDeleted={() => void changed()} />
          ))}
        </ul>
      ) : null}
      <MoreButton hasMore={Boolean(last?.nextCursor)} loading={loadingMore} failure={null} onMore={() => void setSize(size + 1)} />
    </div>
  )
}
