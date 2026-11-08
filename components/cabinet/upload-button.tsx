"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { IMAGE_TYPES } from "@/lib/media"

interface UploadButtonProps {
  label: string
  busy?: boolean
  disabled?: boolean
  onFile(file: File): void
}

/** The button that opens the file chooser for one image. The choice is handed over and cleared, so the same file can be chosen again. */
export function UploadButton({ label, busy = false, disabled = false, onFile }: UploadButtonProps) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.target.files?.[0]
          event.target.value = ""
          if (file) onFile(file)
        }}
      />
      <Button type="button" variant="outline" disabled={busy || disabled} onClick={() => input.current?.click()}>
        {busy ? "Загружаем…" : label}
      </Button>
    </>
  )
}
