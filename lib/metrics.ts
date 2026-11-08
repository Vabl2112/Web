import type { components } from "@/lib/api/schema"

type Schemas = components["schemas"]
export type InquiryMetrics = Schemas["InquiryMetrics"]
export type ShowcaseMetrics = Schemas["ShowcaseMetrics"]
export type InquiryBucket = Schemas["InquiryMetricsBucket"]
export type ShowcaseBucket = Schemas["ShowcaseMetricsBucket"]

const PERCENT = 100

/** A month for the axis of a chart and the rows of a table: "окт. 2026". The API gives the first day of the month. */
export function monthLabel(periodStart: string): string {
  return new Intl.DateTimeFormat("ru-RU", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(periodStart))
}

/** The share of conversations with a reply of the creator ("60 %"); a month without conversations has no rate. */
export function formatRate(rate: number | undefined): string {
  return rate === undefined ? "—" : `${Math.round(rate * PERCENT)} %`
}

/** The buckets from the oldest month to the newest, whatever order the API gave them in. */
export function byMonth<T extends { periodStart: string }>(buckets: T[]): T[] {
  return [...buckets].sort((a, b) => a.periodStart.localeCompare(b.periodStart))
}

export function latestOf<T extends { periodStart: string }>(buckets: T[]): T | undefined {
  return byMonth(buckets).at(-1)
}
