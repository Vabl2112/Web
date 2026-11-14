import type { ReactNode } from "react"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { EggImage } from "@/components/egg-image"
import { initialsOf } from "@/lib/auth/initials"
import { catalogHref, type CreatorProfile } from "@/lib/catalog"

interface CreatorProfileHeaderProps {
  creator: CreatorProfile
  /** What goes under the text, in practice the button "Написать". */
  children?: ReactNode
}

/**
 * The top of a showcase: a large round picture, the name and the text on the left, the place and the tags as dark pills on the right.
 * A value that is absent (bio, city, avatar, tags) leaves no empty heading or hole behind it (AC-05).
 */
export function CreatorProfileHeader({ creator, children }: CreatorProfileHeaderProps) {
  return (
    <header className="flex flex-col gap-6 pb-6 lg:flex-row lg:items-start lg:gap-8">
      {creator.avatar ? (
        <EggImage
          image={creator.avatar}
          alt=""
          sizes="176px"
          className="size-36 shrink-0 rounded-full object-cover shadow-lg ring-4 ring-background sm:size-44"
        />
      ) : (
        <span
          aria-hidden
          className="flex size-36 shrink-0 items-center justify-center rounded-full bg-muted text-5xl font-semibold text-muted-foreground shadow-lg ring-4 ring-background sm:size-44"
        >
          {initialsOf(creator.displayName)}
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-balance sm:text-3xl">{creator.displayName}</h1>
          <Link
            href={catalogHref("/creators", { categoryId: creator.category.id })}
            className="mt-1 inline-block text-muted-foreground underline-offset-4 hover:underline"
          >
            {creator.category.name}
          </Link>
        </div>
        {creator.bio ? <p className="max-w-lg whitespace-pre-line text-muted-foreground">{creator.bio}</p> : null}
        {children}
      </div>
      {creator.city || creator.tags.length > 0 ? (
        <div className="flex flex-col items-start gap-4 lg:items-end">
          {creator.city ? (
            <p className="flex items-center gap-1.5 font-medium">
              <MapPin aria-hidden className="size-5" />
              {creator.city.name}
            </p>
          ) : null}
          {creator.tags.length > 0 ? (
            <ul className="flex flex-wrap gap-2 lg:justify-end">
              {creator.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
