import { api } from "@/lib/api/client"
import { unwrap } from "@/lib/api/answers"
import type { components } from "@/lib/api/schema"

export type MediaUpload = components["schemas"]["MediaUpload"]

/** The limits of `uploadMedia` (AC-42): a JPEG, PNG or WebP of at most 10 MB. The API checks them again; this only saves a long upload. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

/** What is wrong with a file before it is sent, in words for a person; `null` when nothing is. */
export function imageFileProblem(file: { size: number; type: string }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "Подойдёт изображение JPEG, PNG или WebP."
  if (file.size > MAX_IMAGE_BYTES) return "Файл больше 10 МБ."
  if (file.size === 0) return "Файл пустой."
  return null
}

/** Sends the image to `POST /v1/media` and gives back the id to put in an avatar, a listing photo or a work. */
export async function uploadImage(file: File): Promise<MediaUpload> {
  return unwrap(
    api.POST("/v1/media", {
      // The typed body of a file is a string; the serializer below builds the real form, and the browser sets the boundary itself.
      body: { file: "" },
      bodySerializer: () => {
        const form = new FormData()
        form.set("file", file)
        return form
      },
    }),
  )
}
