import { Button } from "@/components/ui/button"

interface MoreButtonProps {
  hasMore: boolean
  loading: boolean
  failure: string | null
  onMore(): void
}

/** The end of a list: "Show more" while there is a next page, and the reason when loading it failed. */
export function MoreButton({ hasMore, loading, failure, onMore }: MoreButtonProps) {
  if (!hasMore && failure === null) return null
  return (
    <div className="flex flex-col items-center gap-2">
      {failure ? (
        <p role="alert" className="text-sm text-destructive">
          {failure}
        </p>
      ) : null}
      {hasMore ? (
        <Button variant="outline" onClick={onMore} disabled={loading}>
          {loading ? "Загружаем…" : "Показать ещё"}
        </Button>
      ) : null}
    </div>
  )
}

export function EmptyState({ children }: { children: string }) {
  return <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">{children}</p>
}
