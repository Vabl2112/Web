/** What is shown instead of a price when the creator has not named one (OD-20). */
export const BY_AGREEMENT = "По договорённости"

/**
 * A price from the minor units of the contract (kopecks): `150000` is `1 500 ₽`, `150050` is `1 500,50 ₽`. A missing price means
 * "by agreement". The currency is the ISO 4217 code of the contract, rubles by default.
 */
export function formatPrice(priceMinor: number | null | undefined, currency = "RUB"): string {
  if (priceMinor === null || priceMinor === undefined) return BY_AGREEMENT
  const amount = priceMinor / 100
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/** The price a listing starts from (`priceFromMinor` is a lower bound): `от 1 500 ₽`, or "by agreement". */
export function formatPriceFrom(priceFromMinor: number | null | undefined, currency = "RUB"): string {
  return priceFromMinor === null || priceFromMinor === undefined ? BY_AGREEMENT : `от ${formatPrice(priceFromMinor, currency)}`
}

/** The Russian form of a noun for a number: `forms` are for 1, 2, and 5 (`1 год`, `2 года`, `5 лет`). */
export function pluralRu(count: number, forms: readonly [string, string, string]): string {
  const lastTwo = Math.abs(count) % 100
  const last = lastTwo % 10
  if (lastTwo >= 11 && lastTwo <= 14) return forms[2]
  if (last === 1) return forms[0]
  return last >= 2 && last <= 4 ? forms[1] : forms[2]
}

export const feedbackCountText = (count: number) => `${count} ${pluralRu(count, ["отзыв", "отзыва", "отзывов"])}`
export const worksCountText = (count: number) => `${count} ${pluralRu(count, ["работа", "работы", "работ"])}`

/** The years of experience from the year the creator started; a year in the future (a clock that is off) is no years. */
export function experienceYears(sinceYear: number, now: Date = new Date()): number {
  return Math.max(0, now.getFullYear() - sinceYear)
}

/** "Опыт 8 лет"; less than a year is "Опыт меньше года". */
export function experienceText(sinceYear: number, now: Date = new Date()): string {
  const years = experienceYears(sinceYear, now)
  return years === 0 ? "Опыт меньше года" : `Опыт ${years} ${pluralRu(years, ["год", "года", "лет"])}`
}

/** The average of the stars as people write it in Russian: one decimal place with a comma. */
export function formatAverage(average: number): string {
  return average.toLocaleString("ru-RU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
