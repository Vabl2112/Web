import type { CreatorProfile } from "@/lib/catalog"
import type { MyCreatorProfile, ShowcaseStatus } from "@/lib/cabinet"
import type { components } from "@/lib/api/schema"

type Schemas = components["schemas"]
export type ModerationQueueState = Schemas["ModerationQueueState"]
export type ModerationQueueItem = Schemas["ModerationQueueItem"]
export type AdminCreatorView = Schemas["AdminCreatorView"]
export type ContentRef = Schemas["ContentRef"]

export const QUEUE_STATES: readonly ModerationQueueState[] = ["PENDING_REVIEW", "NEW_CONTENT", "CHANGED"]

export const QUEUE_LABELS: Record<ModerationQueueState, string> = {
  PENDING_REVIEW: "На проверке",
  NEW_CONTENT: "Новый контент",
  CHANGED: "Изменённые",
}

/** The service level of the team: a request waits at most 48 hours (the plan, A). */
export const SLA_HOURS = 48
/** The reason of a decision is 1 to 1000 characters (AC-15). */
export const MAX_REASON_LENGTH = 1000

const HOUR_MS = 3_600_000
const HOURS_IN_DAY = 24

/** The queue from the address of the page; anything that is not a queue is the first one. */
export function parseQueueState(value: string | undefined): ModerationQueueState {
  return QUEUE_STATES.find((state) => state === value) ?? "PENDING_REVIEW"
}

/** Whole hours since `since`; a time in the future counts as 0. */
export function waitingHours(since: string, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(since).getTime()) / HOUR_MS))
}

/** A request is late when it has waited more than the service level. */
export function isOverdue(since: string, now: Date): boolean {
  return waitingHours(since, now) > SLA_HOURS
}

/** How long a request waits, for a person: "меньше часа", "5 ч", "3 дн.". */
export function formatWaiting(since: string, now: Date): string {
  const hours = waitingHours(since, now)
  if (hours < 1) return "меньше часа"
  if (hours < SLA_HOURS) return `${hours} ч`
  return `${Math.floor(hours / HOURS_IN_DAY)} дн.`
}

/** The time since which the oldest of the entries waits; nothing for an empty queue. */
export function oldestWaiting(items: ModerationQueueItem[]): string | undefined {
  return items.map((item) => item.waitingSince).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]
}

/** Only a showcase that waits for its first review (or a new review after a rejection) can be approved or rejected as a whole. */
export function canDecide(status: ShowcaseStatus): boolean {
  return status === "PENDING_REVIEW"
}

/** Everything of the showcase that waits for approval: the new avatar, listings, photos of listings and works. */
export function pendingRefsOf(view: AdminCreatorView): ContentRef[] {
  const refs: ContentRef[] = []
  // Before the first publication the avatar itself waits (`avatar`); on a published showcase a new one waits next to the old (`pendingAvatar`).
  if (view.profile.avatar?.reviewStatus === "PENDING" || view.profile.pendingAvatar?.reviewStatus === "PENDING") refs.push({ kind: "AVATAR" })
  for (const listing of view.listings) {
    if (listing.reviewStatus === "PENDING") refs.push({ kind: "LISTING", id: listing.id })
    for (const photo of listing.photos) {
      if (photo.reviewStatus === "PENDING") refs.push({ kind: "LISTING_PHOTO", id: photo.id })
    }
  }
  for (const item of view.portfolioItems) {
    if (item.reviewStatus === "PENDING") refs.push({ kind: "PORTFOLIO_ITEM", id: item.id })
  }
  return refs
}

/** What is wrong with the reason of a decision; `null` when nothing is. */
export function reasonProblem(text: string): string | null {
  if (text.trim() === "") return "Укажите причину."
  if (text.length > MAX_REASON_LENGTH) return `Причина длиннее ${MAX_REASON_LENGTH} символов.`
  return null
}

/** The showcase as a visitor would see it, to put the preview on the components of the public page. The new avatar is not in it: it has its own block. */
export function previewOf(profile: MyCreatorProfile): CreatorProfile {
  return {
    id: profile.id,
    displayName: profile.displayName ?? "Без названия",
    category: profile.category ?? { id: "", slug: "", name: "Без категории" },
    tags: profile.tags,
    publishedAt: profile.publishedAt ?? profile.createdAt,
    ...(profile.bio ? { bio: profile.bio } : {}),
    ...(profile.city ? { city: profile.city } : {}),
    ...(profile.avatar ? { avatar: profile.avatar.image } : {}),
  }
}
