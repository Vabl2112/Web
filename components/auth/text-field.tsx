"use client"

import { type ComponentProps, useId } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TextFieldProps extends Omit<ComponentProps<typeof Input>, "id"> {
  label: string
  error?: string
  hint?: string
}

/** A labelled input with its error under it; `props` go to the input as they are, so `{...register("name")}` works. */
export function TextField({ label, error, hint, ...props }: TextFieldProps) {
  const id = useId()
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...props} />
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
