import type { components } from "@/lib/api/schema"

type Schemas = components["schemas"]
export type ShowcaseStatus = Schemas["ShowcaseStatus"]
export type ReviewStatus = Schemas["ReviewStatus"]
export type MissingRequirement = Schemas["MissingRequirement"]
export type SuspensionReason = Schemas["SuspensionReason"]
export type MyCreatorProfile = Schemas["MyCreatorProfile"]
export type MyListing = Schemas["MyListing"]
export type MyPortfolioItem = Schemas["MyPortfolioItem"]
export type CreatorProfileInput = Schemas["CreatorProfileInput"]
export type ListingInput = Schemas["ListingInput"]

export const SHOWCASE_STATUS_LABELS: Record<ShowcaseStatus, string> = {
  DRAFT: "Черновик",
  PENDING_REVIEW: "На проверке",
  PUBLISHED: "Опубликована",
  REJECTED: "Отклонена",
  WITHDRAWN: "Снята с публикации",
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  APPROVED: "Одобрено",
  PENDING: "На проверке",
  REJECTED: "Отклонено",
}

/** What is still missing for a showcase to be sent to review, each with the page of the cabinet where it is done. */
export const MISSING_REQUIREMENTS: Record<MissingRequirement, { text: string; href: string }> = {
  DISPLAY_NAME: { text: "Укажите название витрины", href: "/cabinet/profile" },
  CATEGORY: { text: "Выберите категорию", href: "/cabinet/profile" },
  LISTING_MIN_1: { text: "Добавьте хотя бы одну позицию", href: "/cabinet/listings" },
  PORTFOLIO_MIN_3: { text: "Добавьте не менее трёх работ в портфолио", href: "/cabinet/portfolio" },
}

export const SUSPENSION_LABELS: Record<SuspensionReason, string> = {
  ADMIN: "Витрина скрыта администрацией сервиса.",
  ACCOUNT_SUSPENDED: "Аккаунт приостановлен, поэтому витрина скрыта.",
}

/** Only a draft or a rejected showcase is sent to review; the others are already in the queue, published or withdrawn. */
export function canSubmit(status: ShowcaseStatus): boolean {
  return status === "DRAFT" || status === "REJECTED"
}

const PRICE_PATTERN = /^\d{1,12}([.,]\d{1,2})?$/

/** A price typed in rubles ("1500", "1 500,50") as kopecks; `undefined` for an empty field ("by agreement"), `null` for text that is not a price. */
export function minorOfRubles(text: string): number | undefined | null {
  const compact = text.replace(/\s/g, "")
  if (compact === "") return undefined
  if (!PRICE_PATTERN.test(compact)) return null
  return Math.round(Number(compact.replace(",", ".")) * 100)
}

/** The price of a listing as the text of the field: `150000` is "1500", `150050` is "1500,50", none is an empty field. */
export function rublesOfMinor(minor: number | undefined): string {
  if (minor === undefined) return ""
  const rubles = minor / 100
  return Number.isInteger(rubles) ? String(rubles) : rubles.toFixed(2).replace(".", ",")
}

/** The tags typed with commas: trimmed, without empty ones and without repeats, in the order they were typed. */
export function tagsOfText(text: string): string[] {
  const tags = new Set<string>()
  for (const part of text.split(",")) {
    const tag = part.trim()
    if (tag !== "") tags.add(tag)
  }
  return [...tags]
}

export function textOfTags(tags: string[]): string {
  return tags.join(", ")
}
