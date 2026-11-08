import { describe, expect, it } from "vitest"
import { byMonth, formatRate, latestOf, monthLabel } from "./metrics"

describe("monthLabel", () => {
  it("names the month and the year, not shifted by the time zone of the viewer", () => {
    expect(monthLabel("2026-10-01")).toMatch(/окт/i)
    expect(monthLabel("2026-10-01")).toContain("2026")
    expect(monthLabel("2026-01-01")).toContain("2026")
  })
})

describe("formatRate", () => {
  it("is a rounded percent, and a dash for a month without conversations", () => {
    expect(formatRate(0.6)).toBe("60 %")
    expect(formatRate(2 / 3)).toBe("67 %")
    expect(formatRate(0)).toBe("0 %")
    expect(formatRate(undefined)).toBe("—")
  })
})

describe("byMonth and latestOf", () => {
  const buckets = [{ periodStart: "2026-10-01" }, { periodStart: "2026-08-01" }, { periodStart: "2026-09-01" }]

  it("order the months from the oldest and find the newest", () => {
    expect(byMonth(buckets).map((bucket) => bucket.periodStart)).toEqual(["2026-08-01", "2026-09-01", "2026-10-01"])
    expect(latestOf(buckets)?.periodStart).toBe("2026-10-01")
    expect(latestOf([])).toBeUndefined()
  })

  it("do not change the list they were given", () => {
    byMonth(buckets)

    expect(buckets[0]?.periodStart).toBe("2026-10-01")
  })
})
