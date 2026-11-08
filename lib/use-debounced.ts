"use client"

import { useEffect, useState } from "react"

/** The value after it has stopped changing for `delayMs`: a search that asks the API once the person pauses, not at every key. */
export function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])
  return settled
}
