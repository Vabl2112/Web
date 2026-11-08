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
