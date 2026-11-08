import { expect, test } from "@playwright/test"
import { Api, BASE_URL, prepareCreator } from "./support/world"

// AC-01, AC-04, AC-05 and AC-32 in the part of the web client.
test.describe("the public catalog", () => {
  test("a published showcase is on the public pages, in the HTML that comes without scripts (AC-01, AC-32)", async ({ page, request }) => {
    const creator = await prepareCreator("catalog", { publish: true })

    const html = await (await request.get(`/creators?q=${encodeURIComponent(creator.person.name)}`)).text()
    expect(html, "the list of creators, as the server sends it").toContain(creator.displayName)

    const profile = await (await request.get(`/creators/${creator.creatorId}`)).text()
    expect(profile).toContain(creator.displayName)
    expect(profile).toContain(creator.listingTitle)

    await page.goto(`/creators?q=${encodeURIComponent(creator.person.name)}`)
    await page.getByRole("link", { name: new RegExp(creator.displayName) }).click()
    await expect(page.getByRole("heading", { name: creator.displayName })).toBeVisible()
    await expect(page.getByText("Посуда на гончарном круге.")).toBeVisible()
  })

  test("a draft is not public, an unknown id is not found (AC-01, AC-05)", async ({ request }) => {
    const draft = await prepareCreator("draft")

    expect((await request.get(`/creators/${draft.creatorId}`)).status()).toBe(404)
    expect((await request.get("/creators/00000000-0000-0000-0000-000000000000")).status()).toBe(404)
    expect((await request.get("/api/v1/creators/" + draft.creatorId)).status()).toBe(404)
    const html = await (await request.get(`/creators?q=${encodeURIComponent(draft.person.name)}`)).text()
    expect(html).not.toContain(draft.displayName)
  })

  test("a work of the gallery leads to the showcase of its creator (AC-04)", async ({ page }) => {
    const creator = await prepareCreator("gallery", { publish: true })
    const anonymous = await Api.anonymous()
    const feed = await anonymous.ok<{ items: { creatorId: string; image: { width: number; height: number } }[] }>(anonymous.get("/gallery?limit=60"))
    await anonymous.dispose()
    const mine = feed.items.filter((item) => item.creatorId === creator.creatorId)
    expect(mine.length, "the works of the new showcase are in the feed").toBeGreaterThan(0)
    expect(mine[0]!.image.width).toBeGreaterThan(0)

    await page.goto("/gallery")
    const tile = page.locator(`a[href="/creators/${creator.creatorId}"]`).first()
    await expect(tile).toBeVisible()
    await tile.click()
    await expect(page).toHaveURL(new RegExp(`${BASE_URL}/creators/${creator.creatorId}$`))
  })

  test("the listings of the catalog show the type and the price of a listing", async ({ page }) => {
    const creator = await prepareCreator("listing", { publish: true })

    await page.goto(`/listings?type=READY_PRODUCT&q=${encodeURIComponent(creator.person.name)}`)
    const card = page.getByRole("link", { name: new RegExp(creator.listingTitle) })
    await expect(card).toContainText("Готовый товар")
    await expect(card).toContainText("2 500")
    await card.click()
    await expect(page.getByRole("heading", { name: creator.listingTitle })).toBeVisible()
  })
})
