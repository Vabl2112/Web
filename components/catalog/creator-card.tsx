import Link from "next/link"
import { EggImage } from "@/components/egg-image"
import { Badge } from "@/components/ui/badge"
import { initialsOf } from "@/lib/auth/initials"
import type { CreatorSummary } from "@/lib/catalog"

const MAX_TAGS = 4

/** A showcase in a list: the whole card is the link to it. What the API did not send (city, avatar, tags) is not shown, not faked. */
export function CreatorCard({ creator }: { creator: CreatorSummary }) {
  const place = [creator.category.name, creator.city?.name].filter(Boolean).join(" · ")
  return (
    <Link
      href={`/creators/${creator.id}`}
      className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      {creator.avatar ? (
        <EggImage image={creator.avatar} alt="" sizes="64px" className="size-16 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-muted text-xl font-semibold text-muted-foreground"
        >
          {initialsOf(creator.displayName)}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-1">
        <h3 className="truncate font-semibold">{creator.displayName}</h3>
        <p className="truncate text-sm text-muted-foreground">{place}</p>
        {creator.tags.length > 0 ? (
          <ul className="mt-1 flex flex-wrap gap-1">
            {creator.tags.slice(0, MAX_TAGS).map((tag) => (
              <li key={tag}>
                <Badge variant="secondary">{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Link>
  )
}
