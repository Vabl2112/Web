import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"
import { CONSENT_VERSION } from "@/lib/consent"
import { LegalArticle } from "./legal-article"

describe("LegalArticle", () => {
  it("marks the text as a draft and names its version, so nobody takes it for the final text", () => {
    const html = renderToStaticMarkup(
      <LegalArticle title="Условия использования">
        <p>Текст</p>
      </LegalArticle>,
    )

    expect(html).toContain("Черновик")
    expect(html).toContain(CONSENT_VERSION)
    expect(html).toContain("<h1")
    expect(html).toContain("Текст")
  })

  it("has a version that fits the contract (at most 40 characters)", () => {
    expect(CONSENT_VERSION.length).toBeGreaterThan(0)
    expect(CONSENT_VERSION.length).toBeLessThanOrEqual(40)
  })
})
