"use client"

import { useEffect, useState } from "react"

const MINUTE_MS = 60_000

/** The current time, read again every minute, for ages that are shown on a page that stays open ("waits 5 h"). */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), MINUTE_MS)
    return () => clearInterval(timer)
  }, [])
  return now
}
