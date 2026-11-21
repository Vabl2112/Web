import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import type { CreatorSummary, GalleryItem } from "@/lib/catalog"
import { Landing, previewOf } from "./landing"

// The header reads the session and the router; the landing is checked without it.
vi.mock("@/components/header", () => ({ Header: () => null }))

const IMAGE = { width: 1280, height: 960, variants: [{ width: 640, url: "https://media.example.org/m/640.webp" }] }

function work(n: number, creator = n): GalleryItem {
  return {
    id: `0192f1c6-0000-7000-8000-${String(n).padStart(12, "0")}`,
    creatorId: `0192f1c6-1111-7000-8000-${String(creator).padStart(12, "0")}`,
    author: { displayName: `Мастер ${creator}` },
    category: { id: "0192f1c6-2222-7000-8000-000000000001", slug: "ceramics", name: "Керамика" },
    image: IMAGE,
  } as GalleryItem
}

function creator(n: number, rating?: CreatorSummary["rating"]): CreatorSummary {
  return {
    id: `0192f1c6-1111-7000-8000-${String(n).padStart(12, "0")}`,
    displayName: `Мастер ${n}`,
    category: { id: "0192f1c6-2222-7000-8000-000000000001", slug: "ceramics", name: "Керамика" },
    tags: [],
    verified: false,
    worksCount: 3,
    rating,
  }
}

const works = (count: number) => Array.from({ length: count }, (_, i) => work(i + 1))

describe("Landing", () => {
  it("has the sections of the first front page and leads to the masters and the registration", () => {
    const html = renderToStaticMarkup(<Landing works={works(10)} creators={[creator(1, { average: 4.8, count: 3 })]} />)

    for (const text of ["Платформа для творческих людей", "Найди своего", "Почему выбирают EGG", "Лучшие мастера", "Галерея работ", "Присоединяйтесь к EGG"]) {
      expect(html).toContain(text)
    }
    expect(html).toContain('href="/creators"')
    expect(html).toContain('href="/register"')
    expect(html).toContain('href="/login"')
    expect(html).toContain("4,8")
    expect(html).toContain("3 отзыва")
  })

  it("draws no numbers that nobody counted and no promise of safe deals", () => {
    const html = renderToStaticMarkup(<Landing works={works(10)} creators={[creator(1)]} />)

    expect(html).not.toMatch(/500\+|10K\+|25K\+/)
    expect(html).not.toContain("Безопасные сделки")
  })

  it("leaves out the masters and the gallery when there is nothing to show", () => {
    const html = renderToStaticMarkup(<Landing works={[]} creators={[]} />)

    expect(html).toContain("Найди своего")
    expect(html).not.toContain("Лучшие мастера")
    expect(html).not.toContain("Галерея работ")
    expect(html).not.toContain("<img")
  })

  it("puts a work of the master on the card of the master", () => {
    const html = renderToStaticMarkup(<Landing works={[work(1, 7)]} creators={[creator(7)]} />)

    expect(html).toContain(`href="/creators/${creator(7).id}"`)
    expect(html.match(/<img /g)?.length).toBeGreaterThanOrEqual(2)
  })
})

describe("previewOf", () => {
  it("takes the works after the collage when there are enough of them, the first ones otherwise", () => {
    expect(previewOf(works(10)).map((item) => item.id)).toEqual(works(10).slice(4, 10).map((item) => item.id))
    expect(previewOf(works(7)).map((item) => item.id)).toEqual(works(7).slice(0, 6).map((item) => item.id))
  })
})
