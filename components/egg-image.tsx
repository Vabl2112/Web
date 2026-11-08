"use client"

import { fallbackSrcOf, type ImageRef, srcSetOf } from "@/lib/image-srcset"

interface EggImageProps {
  image: ImageRef
  alt: string
  /** The width the image takes on the page, for the choice of a variant; the whole width by default. */
  sizes?: string
  className?: string
  loading?: "lazy" | "eager"
}

/**
 * An image of the API: a plain `<img>` with every variant in `srcSet` and the size of the image, so the page does not jump while it
 * loads. `next/image` is not used on purpose: the files are served by the media address as they are (F26).
 */
export function EggImage({ image, alt, sizes = "100vw", className, loading = "lazy" }: EggImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- the variants come ready from the API; next/image would resize them again
    <img
      src={fallbackSrcOf(image)}
      srcSet={srcSetOf(image)}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={loading}
      decoding="async"
      className={className}
      style={{ aspectRatio: `${image.width} / ${image.height}` }}
    />
  )
}
