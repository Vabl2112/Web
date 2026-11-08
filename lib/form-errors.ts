import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { type ApiError, fieldErrorsOf } from "@/lib/api/errors"

/**
 * Puts the field errors of a `VALIDATION_FAILED` answer under the fields of a form. `names` maps the path of the API ("priceFromMinor")
 * to the field of the form ("price"); a field that is not in the map is not shown. Gives back whether any error was put in a field.
 */
export function applyFieldErrors<Values extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<Values>,
  names: Record<string, Path<Values>>,
): boolean {
  let applied = false
  for (const [apiField, message] of Object.entries(fieldErrorsOf(error))) {
    const field = names[apiField]
    if (field !== undefined) {
      setError(field, { message })
      applied = true
    }
  }
  return applied
}
