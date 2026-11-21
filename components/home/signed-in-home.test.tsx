import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { FeedPlaceholder, masterHomeOf } from "./signed-in-home"

// The header reads the session and the router; the place of the feed is checked without it.
vi.mock("@/components/header", () => ({ Header: () => null }))

const ID = "0192f1c6-1111-7000-8000-000000000001"

describe("masterHomeOf", () => {
  it("sends a master to the showcase the public sees", () => {
    expect(masterHomeOf({ id: ID, status: "PUBLISHED", suspensionReasons: [] })).toBe(`/creators/${ID}`)
  })

  it("sends a master to the cabinet while the public cannot see the showcase", () => {
    for (const status of ["DRAFT", "PENDING_REVIEW", "REJECTED", "WITHDRAWN"]) {
      expect(masterHomeOf({ id: ID, status, suspensionReasons: [] })).toBe("/cabinet")
    }
    expect(masterHomeOf({ id: ID, status: "PUBLISHED", suspensionReasons: ["ADMIN"] })).toBe("/cabinet")
  })
})

describe("FeedPlaceholder", () => {
  it("says the feed is coming and leads to the sections that exist", () => {
    const html = renderToStaticMarkup(<FeedPlaceholder />)

    expect(html).toContain("Здесь будет ваша лента")
    for (const href of ["/gallery", "/creators", "/listings"]) expect(html).toContain(`href="${href}"`)
  })
})
