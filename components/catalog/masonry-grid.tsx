import Link from "next/link"
import { EggImage } from "@/components/egg-image"
import type { ImageRef } from "@/lib/image-srcset"

export interface MasonryTile {
  id: string
  image: ImageRef
  title?: string
  /** Where the tile leads; a tile without it is only a picture. */
  href?: string
}

/**
 * Works in columns. The height of a tile comes from the size of its image (`width` and `height` go to the `<img>`), so the page does
 * not jump while the pictures load, and the columns are plain CSS.
 */
export function MasonryGrid({ tiles }: { tiles: MasonryTile[] }) {
  return (
    <ul className="columns-2 gap-3 md:columns-3 lg:columns-4">
      {tiles.map((tile) => {
        const picture = (
          <EggImage
            image={tile.image}
            alt={tile.title ?? ""}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="h-auto w-full rounded-xl"
          />
        )
        return (
          <li key={tile.id} className="mb-3 break-inside-avoid">
            {tile.href ? (
              // A picture without a title would be a link without a name for a screen reader.
              <Link href={tile.href} aria-label={tile.title ? undefined : "Открыть работу"} className="block transition-opacity hover:opacity-90">
                {picture}
              </Link>
            ) : (
              picture
            )}
          </li>
        )
      })}
    </ul>
  )
}
