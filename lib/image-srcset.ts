import type { components } from "@/lib/api/schema"

export type ImageRef = components["schemas"]["ImageRef"]

const PREFERRED_WIDTH = 640

function ascending(image: ImageRef) {
  return [...image.variants].sort((a, b) => a.width - b.width)
}

/**
 * The `srcSet` of an image from the variants the API gave. The addresses are used exactly as they came: the web never builds a
 * media address itself (D7).
 */
export function srcSetOf(image: ImageRef): string {
  return ascending(image)
    .map((variant) => `${variant.url} ${variant.width}w`)
    .join(", ")
}

/** The address for the browsers that read `src` only: the variant of 640 pixels, or the next larger one, or the largest there is. */
export function fallbackSrcOf(image: ImageRef): string {
  const variants = ascending(image)
  return (variants.find((variant) => variant.width >= PREFERRED_WIDTH) ?? variants[variants.length - 1])?.url ?? ""
}
