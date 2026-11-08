import Link from "next/link"
import { MapPin } from "lucide-react"
import { EggImage } from "@/components/egg-image"
import { Badge } from "@/components/ui/badge"
import { initialsOf } from "@/lib/auth/initials"
import { catalogHref, type CreatorProfile } from "@/lib/catalog"

/** The top of a showcase. A value that is absent (bio, city, avatar, tags) leaves no empty heading or hole behind it (AC-05). */
export function CreatorProfileHeader({ creator }: { creator: CreatorProfile }) {
  return (
    <header className="flex flex-col gap-6 border-b border-border pb-8 sm:flex-row sm:items-start">
      {creator.avatar ? (
        <EggImage image={creator.avatar} alt="" sizes="176px" className="size-36 shrink-0 rounded-full object-cover sm:size-44" />
      ) : (
        <span
          aria-hidden
          className="flex size-36 shrink-0 items-center justify-center rounded-full bg-muted text-5xl font-semibold text-muted-foreground sm:size-44"
        >
          {initialsOf(creator.displayName)}
        </span>
      )}
      <div className="flex min-w-0 flex-col gap-3">
        <h1 className="text-3xl font-bold text-balance">{creator.displayName}</h1>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
          <Link href={catalogHref("/creators", { categoryId: creator.category.id })} className="underline-offset-4 hover:underline">
            {creator.category.name}
          </Link>
          {creator.city ? (
            <span className="flex items-center gap-1">
              <MapPin aria-hidden className="size-4" />
              {creator.city.name}
            </span>
          ) : null}
        </p>
        {creator.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {creator.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary">{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
        {creator.bio ? <p className="max-w-2xl leading-relaxed whitespace-pre-line">{creator.bio}</p> : null}
      </div>
    </header>
  )
}
