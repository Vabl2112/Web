import { describe, expect, it } from "vitest"
import { fallbackSrcOf, type ImageRef, srcSetOf } from "./image-srcset"

const image = (...widths: number[]): ImageRef => ({
  width: Math.max(...widths, 0),
  height: 100,
  variants: widths.map((width) => ({ width, url: `https://media.example.org/m/${width}.webp` })),
})

describe("srcSetOf", () => {
  it("lists every variant by its width, smallest first, with the addresses as they came", () => {
    expect(srcSetOf(image(1280, 320, 640))).toBe(
      "https://media.example.org/m/320.webp 320w, https://media.example.org/m/640.webp 640w, https://media.example.org/m/1280.webp 1280w",
    )
  })

  it("does not change the list it was given", () => {
    const source = image(1280, 320)

    srcSetOf(source)

    expect(source.variants.map((variant) => variant.width)).toEqual([1280, 320])
  })
})

describe("fallbackSrcOf", () => {
  it("takes the variant of 640 pixels", () => {
    expect(fallbackSrcOf(image(320, 640, 1280))).toBe("https://media.example.org/m/640.webp")
  })

  it("takes the next larger one when there is none of 640", () => {
    expect(fallbackSrcOf(image(320, 960))).toBe("https://media.example.org/m/960.webp")
  })

  it("takes the largest when all are smaller", () => {
    expect(fallbackSrcOf(image(160, 320))).toBe("https://media.example.org/m/320.webp")
  })

  it("is empty for an image without variants", () => {
    expect(fallbackSrcOf(image())).toBe("")
  })
})
