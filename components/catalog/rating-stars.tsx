import { Star } from "lucide-react"
import type { Rating } from "@/lib/catalog"
import { feedbackCountText, formatAverage } from "@/lib/format"
import { cn } from "@/lib/utils"

const STARS = [1, 2, 3, 4, 5]

/** Five stars for a number of stars: those up to the rounded value are filled. Decoration; the text next to it says the number. */
export function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex items-center gap-0.5", className)}>
      {STARS.map((star) => (
        <Star key={star} className={cn("size-4", star <= Math.round(value) ? "fill-foreground text-foreground" : "fill-muted text-muted")} />
      ))}
    </span>
  )
}

/** The stars of a showcase under its name: the five stars, the average and the number of feedbacks; or that there is none yet. */
export function RatingLine({ rating }: { rating?: Rating }) {
  if (rating === undefined) return <p className="mt-1 text-sm text-muted-foreground">Пока нет отзывов</p>
  return (
    <p className="mt-1 flex flex-wrap items-center gap-1">
      <Stars value={rating.average} />
      <span className="ml-1 font-semibold">{formatAverage(rating.average)}</span>
      <span className="text-muted-foreground">({feedbackCountText(rating.count)})</span>
      <span className="sr-only">Средняя оценка {formatAverage(rating.average)} из 5</span>
    </p>
  )
}

/** The same on a card of a list: one amber star, the average and the count; nothing while there is no feedback. */
export function RatingCompact({ rating, className }: { rating?: Rating; className?: string }) {
  if (rating === undefined) return null
  return (
    <p className={cn("flex items-center gap-1", className)}>
      <Star aria-hidden className="size-4 fill-amber-400 text-amber-400" />
      <span className="font-medium">{formatAverage(rating.average)}</span>
      <span className="text-muted-foreground">({feedbackCountText(rating.count)})</span>
    </p>
  )
}
