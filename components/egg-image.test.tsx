import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { EggImage } from "./egg-image"

const image = {
  width: 1280,
  height: 960,
  variants: [
    { width: 1280, url: "https://media.example.org/m/1280.webp" },
    { width: 320, url: "https://media.example.org/m/320.webp" },
  ],
}

describe("EggImage", () => {
  it("gives the browser every variant, the size of the image and a text for those who cannot see it", () => {
    const html = renderToStaticMarkup(createElement(EggImage, { image, alt: "Работа мастера", sizes: "50vw" }))

    expect(html).toContain('srcSet="https://media.example.org/m/320.webp 320w, https://media.example.org/m/1280.webp 1280w"')
    expect(html).toContain('src="https://media.example.org/m/1280.webp"')
    expect(html).toContain('sizes="50vw"')
    expect(html).toContain('width="1280"')
    expect(html).toContain('height="960"')
    expect(html).toContain('alt="Работа мастера"')
    expect(html).toContain('loading="lazy"')
    expect(html).toContain("aspect-ratio:1280 / 960")
  })
})
