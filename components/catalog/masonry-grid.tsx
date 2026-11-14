import Link from "next/link"
import { EggImage } from "@/components/egg-image"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initialsOf } from "@/lib/auth/initials"
import type { ImageRef } from "@/lib/image-srcset"

export interface MasonryTile {
  id: string
  image: ImageRef
  title?: string
  /** Who made the work; shown on the tile when the pointer is over it (or the keyboard focus is on it). */
  author?: { name: string; avatar?: ImageRef }
  /** Where the tile leads; a tile without it is only a picture. */
  href?: string
}

function Caption({ tile }: { tile: MasonryTile }) {
  if (!tile.author && !tile.title) return null
  return (
    <>
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex translate-y-full items-center gap-2 p-4 transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0">
        {tile.author ? (
          <>
            <Avatar className="size-8 shrink-0 border-2 border-white">
              {tile.author.avatar ? (
                <EggImage image={tile.author.avatar} alt="" sizes="32px" className="size-full object-cover" />
              ) : (
                <AvatarFallback className="text-xs">{initialsOf(tile.author.name)}</AvatarFallback>
              )}
            </Avatar>
            <span className="min-w-0 truncate text-sm font-medium text-white">{tile.author.name}</span>
          </>
        ) : (
          <span className="min-w-0 truncate text-sm font-medium text-white">{tile.title}</span>
        )}
      </span>
    </>
  )
}

/**
 * Works in columns, like a board of pictures. The height of a tile comes from the size of its image (`width` and `height` go to the
 * `<img>`), so the page does not jump while the pictures load, and the columns are plain CSS. A tile lifts its picture and shows who
 * made the work when the pointer is over it.
 */
export function MasonryGrid({ tiles }: { tiles: MasonryTile[] }) {
  return (
    <ul className="columns-2 gap-4 md:columns-3 lg:columns-4">
      {tiles.map((tile) => {
        const picture = (
          <EggImage
            image={tile.image}
            alt={tile.title ?? ""}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-auto w-full transition-transform duration-300 group-hover:scale-105 group-focus-visible:scale-105"
          />
        )
        const label = tile.title ?? tile.author?.name
        return (
          <li key={tile.id} className="mb-4 break-inside-avoid">
            {tile.href ? (
              // A picture without a title would be a link without a name for a screen reader.
              <Link
                href={tile.href}
                aria-label={label ? undefined : "Открыть работу"}
                className="group relative block overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {picture}
                <Caption tile={tile} />
              </Link>
            ) : (
              <div className="group relative overflow-hidden rounded-xl">
                {picture}
                <Caption tile={tile} />
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
