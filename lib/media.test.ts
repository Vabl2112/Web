import { describe, expect, it } from "vitest"
import { MAX_IMAGE_BYTES, imageFileProblem } from "./media"

describe("imageFileProblem", () => {
  it("takes a JPEG, PNG or WebP within the limit", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(imageFileProblem({ type, size: 1000 })).toBeNull()
    }
    expect(imageFileProblem({ type: "image/jpeg", size: MAX_IMAGE_BYTES })).toBeNull()
  })

  it("refuses another type", () => {
    expect(imageFileProblem({ type: "image/gif", size: 1000 })).toBe("Подойдёт изображение JPEG, PNG или WebP.")
    expect(imageFileProblem({ type: "application/pdf", size: 1000 })).not.toBeNull()
  })

  it("refuses a file over 10 MB and an empty one", () => {
    expect(imageFileProblem({ type: "image/png", size: MAX_IMAGE_BYTES + 1 })).toBe("Файл больше 10 МБ.")
    expect(imageFileProblem({ type: "image/png", size: 0 })).toBe("Файл пустой.")
  })
})
