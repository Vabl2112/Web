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
    // The sections of a showcase are tabs, and a visitor cannot hide them.
    await expect(page.getByRole("tab", { name: "Портфолио" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Настроить разделы" })).toHaveCount(0)
  })

  test("every page carries the security headers, with the media origin in the policy", async ({ request }) => {
    for (const path of ["/", "/creators", "/login"]) {
      const headers = (await request.get(path)).headers()

      expect(headers["x-content-type-options"], path).toBe("nosniff")
      expect(headers["x-frame-options"], path).toBe("DENY")
      expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin")
      expect(headers["permissions-policy"], path).toContain("camera=()")
      expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'")
    }
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
    const card = page.getByRole("article").filter({ hasText: creator.listingTitle })
    await expect(card).toContainText("Готовый товар")
    await expect(card).toContainText("2 500")
    await expect(card).toContainText(creator.person.name)
    await expect(card.getByRole("link", { name: "Написать" })).toBeVisible()
    await card.getByRole("link", { name: new RegExp(creator.listingTitle) }).click()
    await expect(page.getByRole("heading", { name: creator.listingTitle, level: 1 })).toBeVisible()
    // The page of one listing has the look of its card: the fact of the type, the maker as a link to the showcase, the way back.
    await expect(page.getByText("В наличии")).toBeVisible()
    await expect(page.getByRole("link", { name: new RegExp(`${creator.displayName}.*Открыть витрину`) })).toHaveAttribute("href", `/creators/${creator.creatorId}`)
    await page.getByRole("link", { name: "Услуги и товары" }).last().click()
    await expect(page).toHaveURL(/\/listings$/)
  })

  test("services and goods have the filters of the first web in a sidebar, the chips of what is set and the list view", async ({ page }) => {
    const creator = await prepareCreator("sidebar", { publish: true })

    await page.goto(`/listings?q=${encodeURIComponent(creator.person.name)}`)
    const sidebar = page.getByRole("complementary", { name: "Фильтры" })
    await sidebar.getByRole("link", { name: "Готовые товары" }).click()
    await expect(page).toHaveURL(/type=READY_PRODUCT/)
    await expect(sidebar.getByRole("link", { name: /Сбросить фильтры \(2\)/ })).toBeVisible()
    await expect(page.getByRole("article").filter({ hasText: creator.listingTitle })).toBeVisible()

    // The list view is in the address and stays with the filters; a chip takes its filter off.
    await page.getByRole("link", { name: "Списком" }).click()
    await expect(page).toHaveURL(/view=list/)
    await expect(page.getByRole("article").filter({ hasText: creator.listingTitle })).toBeVisible()
    await page.getByRole("link", { name: "Убрать фильтр: Готовые товары" }).click()
    await expect(page).not.toHaveURL(/type=/)
    await expect(page).toHaveURL(/view=list/)
  })

  test.describe("on a phone", () => {
    test.use({ viewport: { width: 390, height: 800 } })

    test("the filters are behind the button, a chosen filter closes the sheet and is counted on the button", async ({ page }) => {
      await page.goto("/creators")
      // The categories of the page are behind the button; the search is in the page, without a button of its own.
      await expect(page.getByRole("link", { name: "Тату", exact: true })).toBeHidden()
      // The button of the search is there for a screen reader only: one pixel wide.
      expect((await page.getByRole("button", { name: "Найти" }).boundingBox())?.width ?? 0).toBeLessThanOrEqual(1)

      await page.getByRole("button", { name: "Фильтры" }).click()
      const sheet = page.getByRole("dialog", { name: "Фильтры" })
      await expect(sheet.getByRole("link", { name: "Тату", exact: true })).toBeVisible()
      // The search of a city does not take the focus (a phone would raise its keyboard); the sheet itself does, so a screen reader lands in it.
      await expect(sheet.getByLabel("Город")).not.toBeFocused()
      await expect(sheet).toBeFocused()

      await sheet.getByRole("link", { name: "Тату", exact: true }).click()
      await expect(page).toHaveURL(/categoryId=/)
      await expect(sheet).toBeHidden()
      await expect(page.getByRole("button", { name: /Фильтры/ })).toContainText("1")
    })
  })

  test("the search filters while the person types, without a button to press", async ({ page }) => {
    const creator = await prepareCreator("live", { publish: true })
    await page.goto("/creators")
    await page.getByRole("searchbox", { name: "Имя, занятие или тег" }).fill(creator.person.name)
    await expect(page).toHaveURL(/[?&]q=live/)
    await expect(page.getByRole("article").filter({ hasText: creator.displayName })).toBeVisible()
  })
})
