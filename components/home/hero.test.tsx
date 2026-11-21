import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { GalleryItem } from "@/lib/catalog"
import { Hero } from "./hero"

const IMAGE = { width: 1280, height: 960, variants: [{ width: 640, url: "https://media.example.org/m/640.webp" }] }

function work(n: number): GalleryItem {
  return {
    id: `0192f1c6-0000-7000-8000-00000000000${n}`,
    creatorId: `0192f1c6-1111-7000-8000-00000000000${n}`,
    author: { displayName: `Мастер ${n}` },
    category: { id: "0192f1c6-2222-7000-8000-000000000001", slug: "ceramics", name: "Керамика" },
    image: IMAGE,
  } as GalleryItem
}

describe("Hero", () => {
  it("has the line, the two buttons and the collage of real works, each leading to its showcase", () => {
    const html = renderToStaticMarkup(<Hero works={[work(1), work(2), work(3), work(4)]} />)

    expect(html).toContain("Платформа для творческих людей")
    expect(html).toContain("Найди своего")
    expect(html).toContain("text-amber-500")
    expect(html).toContain('href="/creators"')
    expect(html).toContain('href="/register"')
    for (const n of [1, 2, 3, 4]) expect(html).toContain(`href="/creators/0192f1c6-1111-7000-8000-00000000000${n}"`)
    expect(html.match(/<img /g)).toHaveLength(4)
    expect(html).toContain("aspect-[3/4]")
  })

  it("has no collage without works, and draws no numbers that nobody counted", () => {
    const html = renderToStaticMarkup(<Hero works={[]} />)

    expect(html).toContain("Найди своего")
    expect(html).not.toContain("<img")
    expect(html).not.toMatch(/\d+K\+|500\+/)
  })

  it("takes the pictures it has when there are fewer than four", () => {
    const html = renderToStaticMarkup(<Hero works={[work(1), work(2)]} />)

    expect(html.match(/<img /g)).toHaveLength(2)
  })
})
