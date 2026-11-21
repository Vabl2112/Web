import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import type { Category, CreatorProfile, CreatorSummary, ListingSummary } from "@/lib/catalog"
import { CreatorCard } from "./creator-card"
import { CreatorProfileHeader } from "./creator-profile-header"
import { CategoryChips, SearchForm, TypeTabs } from "./filters"
import { ListingCard } from "./listing-card"
import { MasonryGrid } from "./masonry-grid"

const plain = (text: string) => text.replace(/\s/g, " ")

const CERAMICS = { id: "0192f1c6-1111-7000-8000-000000000001", slug: "ceramics", name: "Керамика" }
const KAZAN = { id: "0192f1c6-2222-7000-8000-000000000002", name: "Казань" }
const IMAGE = { width: 1280, height: 960, variants: [{ width: 640, url: "https://media.example.org/m/640.webp" }] }

const creator: CreatorSummary = {
  id: "0192f1c6-2a7e-7d3a-9d6c-5b1f3a0c4e11",
  displayName: "Анна Керамика",
  category: CERAMICS,
  tags: [],
  verified: false,
  worksCount: 0,
}

describe("CreatorCard", () => {
  it("links to the showcase and shows the name and the category", () => {
    const html = renderToStaticMarkup(<CreatorCard creator={creator} />)

    expect(html).toContain(`href="/creators/${creator.id}"`)
    expect(html).toContain("Анна Керамика")
    expect(html).toContain("Керамика")
    expect(html).toContain("Профиль")
  })

  it("leaves out what the API did not send: the city, the tags, the avatar", () => {
    const html = renderToStaticMarkup(<CreatorCard creator={creator} />)

    expect(html).not.toContain("Казань")
    expect(html).not.toContain("<ul")
    expect(html).not.toContain("<img")
  })

  it("adds the city, the tags and the avatar when there are some", () => {
    const html = renderToStaticMarkup(<CreatorCard creator={{ ...creator, city: KAZAN, tags: ["кружки", "ручная работа"], avatar: IMAGE }} />)

    expect(html).toContain("Казань")
    expect(html).toContain("кружки")
    expect(html).toContain("<img")
  })

  it("shows the mark, the stars, the experience and the works when the API sent them (AC-47, AC-48)", () => {
    const html = renderToStaticMarkup(
      <CreatorCard creator={{ ...creator, verified: true, rating: { average: 4.8, count: 12 }, experienceSinceYear: 2016, worksCount: 24 }} />,
    )

    expect(html).toContain("Проверен")
    expect(html).toContain("4,8")
    expect(html).toContain("(12 отзывов)")
    expect(html).toContain("Опыт")
    expect(html).toContain("24 работы")
  })

  it("shows none of them when the API sent none: no mark, no stars, no empty counts", () => {
    const html = renderToStaticMarkup(<CreatorCard creator={creator} />)

    expect(html).not.toContain("Проверен")
    expect(html).not.toContain("отзыв")
    expect(html).not.toContain("Опыт")
    expect(html).not.toContain("0 работ")
  })

  it("puts the given action beside the button to the showcase", () => {
    const html = renderToStaticMarkup(<CreatorCard creator={creator} action={<button>Написать</button>} />)

    expect(html).toContain("Написать")
  })
})

const listing: ListingSummary = {
  id: "0192f1c6-3333-7000-8000-000000000003",
  creator: { id: creator.id, displayName: "Анна Керамика" },
  type: "READY_PRODUCT",
  title: "Кружка ручной работы",
  category: CERAMICS,
  currency: "RUB",
  deliveryAvailable: false,
}

describe("ListingCard", () => {
  it("says 'by agreement' when there is no price, and names the type and the maker", () => {
    const html = renderToStaticMarkup(<ListingCard listing={listing} />)

    expect(html).toContain("По договорённости")
    expect(html).toContain("Готовый товар")
    expect(html).toContain("Кружка ручной работы")
    expect(html).toContain("Анна Керамика")
    expect(html).toContain(`href="/listings/${listing.id}"`)
  })

  it("links the maker to the showcase, and leaves the maker out on the showcase of that maker", () => {
    const withMaker = renderToStaticMarkup(<ListingCard listing={listing} />)
    const without = renderToStaticMarkup(<ListingCard listing={listing} showMaker={false} />)

    expect(withMaker).toContain(`href="/creators/${creator.id}"`)
    expect(without).not.toContain(`href="/creators/${creator.id}"`)
    expect(without).not.toContain("Анна Керамика")
  })

  it("puts the given action at the bottom of the card", () => {
    const html = renderToStaticMarkup(<ListingCard listing={listing} action={<button>Написать</button>} />)

    expect(html).toContain("Написать")
  })

  it("shows the price from, the city and the delivery", () => {
    const html = plain(renderToStaticMarkup(<ListingCard listing={{ ...listing, priceFromMinor: 250000, city: KAZAN, deliveryAvailable: true }} />))

    expect(html).toContain("от 2 500 ₽")
    expect(html).toContain("Казань · доставка")
  })

  it("is the product card for goods (the photo, the type on it) and the service card for a service (no photo, a line over the maker)", () => {
    const action = <button>Написать</button>
    const product = renderToStaticMarkup(<ListingCard listing={{ ...listing, photo: IMAGE }} action={action} />)
    const service = renderToStaticMarkup(<ListingCard listing={{ ...listing, type: "SERVICE", photo: IMAGE }} action={action} />)

    expect(product).toContain("<img")
    expect(product).toContain("aspect-square")
    expect(product).toContain("Готовый товар")
    expect(service).not.toContain("<img")
    expect(service).toContain("border-t")
    expect(service).toContain("Услуга")
    expect(service).toContain("Керамика")
    expect(service).toContain("Анна Керамика")
    expect(service).toContain("Написать")
  })
})

const profile: CreatorProfile = { ...creator, publishedAt: "2026-10-25T09:30:00Z" }

const RATED: CreatorProfile = { ...profile, verified: true, rating: { average: 5, count: 1 }, worksCount: 3, experienceSinceYear: 2020 }

describe("CreatorProfileHeader", () => {
  it("has no empty sections for a showcase without a bio, a city and tags (AC-05)", () => {
    const html = renderToStaticMarkup(<CreatorProfileHeader creator={profile} />)

    expect(html).toContain("<h1")
    expect(html).toContain("Анна Керамика")
    expect(html).not.toContain("<ul")
    expect(html).not.toContain("leading-relaxed")
    expect(html).not.toContain("Казань")
  })

  it("shows the bio, the city and the tags when there are some", () => {
    const html = renderToStaticMarkup(<CreatorProfileHeader creator={{ ...profile, bio: "Посуда на гончарном круге.", city: KAZAN, tags: ["кружки"] }} />)

    expect(html).toContain("Посуда на гончарном круге.")
    expect(html).toContain("Казань")
    expect(html).toContain("кружки")
  })

  it("shows the stars, the mark, the experience and the works from the API (AC-47, AC-48)", () => {
    const html = renderToStaticMarkup(<CreatorProfileHeader creator={RATED} />)

    expect(html).toContain("Проверен")
    expect(html).toContain("5,0")
    expect(html).toContain("(1 отзыв)")
    expect(html).toContain("Опыт")
    expect(html).toContain("3 работы")
  })

  it("says there is no feedback yet, and shows no mark and no counts, when the API sent none", () => {
    const html = renderToStaticMarkup(<CreatorProfileHeader creator={profile} />)

    expect(html).toContain("Пока нет отзывов")
    expect(html).not.toContain("Проверен")
    expect(html).not.toContain("Опыт")
  })
})

describe("MasonryGrid", () => {
  it("makes a link of a tile that has a destination and leaves the others as pictures", () => {
    const html = renderToStaticMarkup(
      <MasonryGrid
        tiles={[
          { id: "a", image: IMAGE, title: "Ваза", href: "/creators/42" },
          { id: "b", image: IMAGE },
        ]}
      />,
    )

    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).toContain('href="/creators/42"')
    expect(html.match(/<img /g)).toHaveLength(2)
    expect(html).toContain('alt="Ваза"')
  })
})

const categories: Category[] = [{ ...CERAMICS, children: [{ id: "0192f1c6-1111-7000-8000-000000000011", slug: "tableware", name: "Посуда" }] }]

describe("CategoryChips", () => {
  it("links every category with its id and marks the chosen one", () => {
    const html = renderToStaticMarkup(<CategoryChips categories={categories} basePath="/gallery" query={{ categoryId: CERAMICS.id }} />)

    expect(html).toContain(`href="/gallery?categoryId=${CERAMICS.id}"`)
    expect(html).toContain('href="/gallery"')
    expect(html.match(/aria-current="true"/g)).toHaveLength(1)
  })

  it("offers the subcategories of the chosen category only when asked to", () => {
    const query = { categoryId: CERAMICS.id }

    expect(renderToStaticMarkup(<CategoryChips categories={categories} basePath="/gallery" query={query} />)).not.toContain("Посуда")
    expect(renderToStaticMarkup(<CategoryChips categories={categories} basePath="/gallery" query={query} withSubcategories />)).toContain("Посуда")
    expect(renderToStaticMarkup(<CategoryChips categories={categories} basePath="/gallery" query={{}} withSubcategories />)).not.toContain("Посуда")
  })
})

describe("Chip sizes", () => {
  it("draws a filter in the size of the prototype page it belongs to: a small badge, a pill, a big pill", () => {
    const chips = (size: "badge" | "md" | "lg") => renderToStaticMarkup(<CategoryChips categories={categories} basePath="/creators" query={{}} size={size} />)

    expect(chips("badge")).toContain("text-xs")
    expect(chips("badge")).not.toContain("rounded-full")
    expect(chips("md")).toContain("px-4 py-2")
    expect(chips("lg")).toContain("px-5 py-2.5")
  })
})

describe("TypeTabs", () => {
  it("has a tab for every type of listing and keeps the other filters in the links", () => {
    const html = renderToStaticMarkup(<TypeTabs basePath="/listings" query={{ q: "чашка", type: "SERVICE" }} />)

    expect(html).toContain("Услуга")
    expect(html).toContain("Готовый товар")
    expect(html).toContain("На заказ")
    expect(html).toContain("type=READY_PRODUCT")
    expect(html).toContain("q=")
  })
})

describe("SearchForm", () => {
  it("is a plain GET form that keeps the other filters in hidden fields", () => {
    const html = renderToStaticMarkup(<SearchForm action="/listings" query={{ categoryId: CERAMICS.id, type: "SERVICE", q: "кружка" }} placeholder="Поиск" />)

    expect(html).toContain('action="/listings"')
    expect(html).toContain('method="get"')
    expect(html).toContain(`name="categoryId" value="${CERAMICS.id}"`)
    expect(html).toContain('name="type" value="SERVICE"')
    expect(html).toContain('name="q"')
    expect(html).toContain('value="кружка"')
    // No visible button, as in the prototype: Enter sends the form, and the button that is there is for a screen reader only.
    expect(html).toContain("sr-only")
  })
})
