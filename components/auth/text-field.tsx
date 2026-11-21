"use client"

import { type ComponentProps, type ReactNode, useId } from "react"
import type { LucideIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TextFieldProps extends Omit<ComponentProps<typeof Input>, "id"> {
  label: string
  error?: string
  hint?: ReactNode
  /** An icon inside the field on the left (the registration page of the first prototype has them). */
  icon?: LucideIcon
  /** What stands inside the field on the right, such as the button that shows the password. */
  end?: ReactNode
}

/** A labelled input with its error under it; `props` go to the input as they are, so `{...register("name")}` works. */
export function TextField({ label, error, hint, icon: Icon, end, className, ...props }: TextFieldProps) {
  const id = useId()
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {Icon ? <Icon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" /> : null}
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(Icon && "pl-10", end !== undefined && "pr-10", className)}
          {...props}
        />
        {end !== undefined ? <div className="absolute top-1/2 right-3 flex -translate-y-1/2">{end}</div> : null}
      </div>
      {hint ? (
        <div id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </div>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
