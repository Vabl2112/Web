import { describe, expect, it } from "vitest"
import type { MyCreatorProfile, MyListing, MyPortfolioItem } from "./cabinet"
import {
  type AdminCreatorView,
  type ModerationQueueItem,
  MAX_REASON_LENGTH,
  canDecide,
  formatWaiting,
  isOverdue,
  oldestWaiting,
  parseQueueState,
  pendingRefsOf,
  previewOf,
  reasonProblem,
  waitingHours,
} from "./moderation"

const NOW = new Date("2026-11-08T12:00:00Z")
const ago = (hours: number) => new Date(NOW.getTime() - hours * 3_600_000).toISOString()

describe("parseQueueState", () => {
  it("reads a queue and falls back to the first one", () => {
    expect(parseQueueState("NEW_CONTENT")).toBe("NEW_CONTENT")
    expect(parseQueueState("CHANGED")).toBe("CHANGED")
    expect(parseQueueState("nonsense")).toBe("PENDING_REVIEW")
    expect(parseQueueState(undefined)).toBe("PENDING_REVIEW")
  })
})

describe("waiting time", () => {
  it("counts whole hours and never goes below 0", () => {
    expect(waitingHours(ago(5.9), NOW)).toBe(5)
    expect(waitingHours(ago(-3), NOW)).toBe(0)
  })

  it("is late only after the 48 hours of the service level", () => {
    expect(isOverdue(ago(48), NOW)).toBe(false)
    expect(isOverdue(ago(49), NOW)).toBe(true)
    expect(isOverdue(ago(1), NOW)).toBe(false)
  })

  it("is told in words", () => {
    expect(formatWaiting(ago(0.2), NOW)).toBe("меньше часа")
    expect(formatWaiting(ago(5), NOW)).toBe("5 ч")
    expect(formatWaiting(ago(47), NOW)).toBe("47 ч")
    expect(formatWaiting(ago(72), NOW)).toBe("3 дн.")
  })
})

describe("oldestWaiting", () => {
  const item = (hours: number): ModerationQueueItem => ({
    creatorId: `c${hours}`,
    status: "PENDING_REVIEW",
    waitingSince: ago(hours),
    pendingContentCount: 0,
    changedSinceReview: false,
  })

  it("is the earliest time of the queue, and nothing for an empty queue", () => {
    expect(oldestWaiting([item(3), item(30), item(10)])).toBe(ago(30))
    expect(oldestWaiting([])).toBeUndefined()
  })
})

describe("canDecide", () => {
  it("is true only for a showcase that waits for its review", () => {
    expect(canDecide("PENDING_REVIEW")).toBe(true)
    for (const status of ["DRAFT", "PUBLISHED", "REJECTED", "WITHDRAWN"] as const) {
      expect(canDecide(status)).toBe(false)
    }
  })
})

describe("reasonProblem", () => {
  it("wants a reason of 1 to 1000 characters", () => {
    expect(reasonProblem("")).toBe("Укажите причину.")
    expect(reasonProblem("   ")).toBe("Укажите причину.")
    expect(reasonProblem("я".repeat(MAX_REASON_LENGTH + 1))).not.toBeNull()
    expect(reasonProblem("Фото не ваши")).toBeNull()
    expect(reasonProblem("я".repeat(MAX_REASON_LENGTH))).toBeNull()
  })
})

const image = { width: 100, height: 100, variants: [{ width: 100, url: "https://media.example.org/a.webp" }] }
const profile = (extra: Partial<MyCreatorProfile> = {}): MyCreatorProfile => ({
  id: "c1",
  status: "PENDING_REVIEW",
  suspensionReasons: [],
  tags: [],
  changedSinceReview: false,
  createdAt: "2026-11-01T00:00:00Z",
  ...extra,
})
const listing = (id: string, reviewStatus: MyListing["reviewStatus"], photoStatuses: MyListing["reviewStatus"][] = []) =>
  ({ id, reviewStatus, photos: photoStatuses.map((status, index) => ({ id: `${id}-p${index}`, image, reviewStatus: status })) }) as MyListing
const work = (id: string, reviewStatus: MyPortfolioItem["reviewStatus"]) => ({ id, reviewStatus }) as MyPortfolioItem
const view = (parts: Partial<AdminCreatorView>): AdminCreatorView => ({
  profile: profile(),
  owner: { id: "u1", email: "a@example.org", name: "Анна", status: "ACTIVE" },
  listings: [],
  portfolioItems: [],
  ...parts,
})

describe("pendingRefsOf", () => {
  it("lists exactly what waits: the new avatar, listings, their photos and works", () => {
    const refs = pendingRefsOf(
      view({
        profile: profile({ pendingAvatar: { image, reviewStatus: "PENDING" } }),
        listings: [listing("l1", "PENDING", ["APPROVED", "PENDING"]), listing("l2", "APPROVED", ["PENDING"]), listing("l3", "APPROVED", ["REJECTED"])],
        portfolioItems: [work("w1", "PENDING"), work("w2", "APPROVED")],
      }),
    )

    expect(refs).toEqual([
      { kind: "AVATAR" },
      { kind: "LISTING", id: "l1" },
      { kind: "LISTING_PHOTO", id: "l1-p1" },
      { kind: "LISTING_PHOTO", id: "l2-p0" },
      { kind: "PORTFOLIO_ITEM", id: "w1" },
    ])
  })

  it("counts the avatar of a showcase that was never published: it waits in `avatar`, not in `pendingAvatar`", () => {
    const refs = pendingRefsOf(view({ profile: profile({ avatar: { image, reviewStatus: "PENDING" } }) }))

    expect(refs).toEqual([{ kind: "AVATAR" }])
  })

  it("counts an avatar once when both fields wait", () => {
    const refs = pendingRefsOf(
      view({ profile: profile({ avatar: { image, reviewStatus: "PENDING" }, pendingAvatar: { image, reviewStatus: "PENDING" } }) }),
    )

    expect(refs).toEqual([{ kind: "AVATAR" }])
  })

  it("is empty when nothing waits", () => {
    expect(pendingRefsOf(view({ listings: [listing("l1", "APPROVED", ["APPROVED"])] }))).toEqual([])
    expect(pendingRefsOf(view({ profile: profile({ pendingAvatar: { image, reviewStatus: "REJECTED" } }) }))).toEqual([])
  })
})

describe("previewOf", () => {
  it("gives a showcase without a name and a category placeholders and leaves out what is absent", () => {
    const preview = previewOf(profile())

    expect(preview.displayName).toBe("Без названия")
    expect(preview.category.name).toBe("Без категории")
    expect(preview).not.toHaveProperty("bio")
    expect(preview).not.toHaveProperty("avatar")
  })

  it("takes the approved avatar, not the one that waits", () => {
    const approved = { ...image, width: 200 }

    const preview = previewOf(
      profile({
        displayName: "Анна",
        bio: "О себе",
        avatar: { image: approved, reviewStatus: "APPROVED" },
        pendingAvatar: { image, reviewStatus: "PENDING" },
      }),
    )

    expect(preview).toMatchObject({ displayName: "Анна", bio: "О себе", avatar: approved })
  })
})
