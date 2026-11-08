"use client"

import { type ComponentProps, type ReactNode, useId } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive"

interface ShellProps {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

function Shell({ id, label, error, hint, children }: ShellProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
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

const describedBy = (id: string, error?: string, hint?: string) =>
  [error ? `${id}-error` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined

interface SelectFieldProps extends Omit<ComponentProps<"select">, "id"> {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  hint?: string
}

/** A native select: it works with `register(...)` of react-hook-form as it is, and on a phone it opens the system list. */
export function SelectField({ label, options, placeholder, error, hint, ...props }: SelectFieldProps) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <select id={id} className={SELECT_CLASS} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props}>
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  )
}

interface TextAreaFieldProps extends Omit<ComponentProps<typeof Textarea>, "id"> {
  label: string
  error?: string
  hint?: string
}

export function TextAreaField({ label, error, hint, ...props }: TextAreaFieldProps) {
  const id = useId()
  return (
    <Shell id={id} label={label} error={error} hint={hint}>
      <Textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} {...props} />
    </Shell>
  )
}

export function CheckboxField({ label, ...props }: Omit<ComponentProps<"input">, "id" | "type"> & { label: string }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <input id={id} type="checkbox" className="size-4 accent-foreground" {...props} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  )
}
