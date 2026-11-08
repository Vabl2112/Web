/** The `searchParams` of a page in Next 16: a promise of the query, where a repeated parameter is a list. */
export type SearchParams = Promise<Record<string, string | string[] | undefined>>

/** One query parameter: the first value when it is repeated, nothing when it is absent or empty. */
export function firstOf(value: string | string[] | undefined): string | undefined {
  const first = Array.isArray(value) ? value[0] : value
  return first === undefined || first === "" ? undefined : first
}
