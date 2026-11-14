import type { ReactNode } from "react"
import Link from "next/link"
import { MapPin } from "lucide-react"
import { EggImage } from "@/components/egg-image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { initialsOf } from "@/lib/auth/initials"
import type { CreatorSummary } from "@/lib/catalog"

const MAX_TAGS = 4

interface CreatorCardProps {
  creator: CreatorSummary
  /** What stands next to the button to the showcase (the button to write); the list passes it, since it needs the session. */
  action?: ReactNode
}

/**
 * A showcase in a list, one on a row as in the first prototype: a large avatar, the name, the category and the city, the tags, and the
 * buttons on the right. What the API did not send (city, avatar, tags) is not shown, not faked.
 */
export function CreatorCard({ creator, action }: CreatorCardProps) {
  const href = `/creators/${creator.id}`
  return (
    <article className="group rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-lg sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <Link href={href} tabIndex={-1} aria-hidden className="shrink-0 self-center sm:self-start">
          <Avatar className="size-24 shadow-lg ring-4 ring-background transition-transform group-hover:scale-105 sm:size-28">
            {creator.avatar ? (
              <EggImage image={creator.avatar} alt="" sizes="112px" className="size-full object-cover" />
            ) : (
              <AvatarFallback className="text-2xl font-semibold">{initialsOf(creator.displayName)}</AvatarFallback>
            )}
          </Avatar>
        </Link>
        <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
          <h3 className="text-lg font-semibold text-foreground sm:text-xl">
            <Link href={href} className="transition-colors hover:text-foreground/80">
              {creator.displayName}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{creator.category.name}</p>
          {creator.city ? (
            <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
              <MapPin aria-hidden className="size-4" />
              {creator.city.name}
            </p>
          ) : null}
          {creator.tags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {creator.tags.slice(0, MAX_TAGS).map((tag) => (
                <li key={tag}>
                  <Badge variant="outline" className="rounded-full">
                    {tag}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="mt-2 flex flex-col gap-2 sm:mt-0 sm:shrink-0">
          <Button asChild className="w-full sm:w-auto">
            <Link href={href}>Профиль</Link>
          </Button>
          {action}
        </div>
      </div>
    </article>
  )
}
