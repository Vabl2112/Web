import { expect, test } from "@playwright/test"
import { adminApi, ADMIN, Api, newPerson, prepareCreator, registerConfirmed, signIn } from "./support/world"

// AC-15, AC-16, AC-17 and AC-40 (б) in the part of the web client.
test.describe("moderation", () => {
  // The specs sign in as the administrator through the login page; on an empty database that account does not exist yet.
  test.beforeAll(async () => {
    await (await adminApi()).dispose()
  })

  test("a rejection with a reason reaches the creator, and the showcase is public after the fix is approved (AC-15, AC-16)", async ({ page, browser }) => {
    const creator = await prepareCreator("reject", { submit: true })
    await signIn(page, ADMIN, "/admin/moderation")
    const row = page.getByRole("link", { name: new RegExp(creator.displayName) })
    await expect(row).toBeVisible()
    await row.click()

    await expect(page.getByRole("button", { name: /Одобрить всё ожидающее/ })).toBeVisible()
    await page.getByRole("button", { name: "Отклонить…" }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByRole("button", { name: "Отклонить", exact: true }).click()
    await expect(dialog.getByText("Укажите причину.")).toBeVisible()
    await dialog.getByLabel("Причина").fill("Фото не ваши.")
    await dialog.getByRole("button", { name: "Отклонить", exact: true }).click()
    await expect(dialog).toBeHidden()

    // The creator sees the status and the reason in the cabinet.
    const profile = await creator.api.ok<{ status: string; rejectionReason?: string }>(creator.api.get("/me/creator-profile"))
    expect(profile.status).toBe("REJECTED")
    expect(profile.rejectionReason).toBe("Фото не ваши.")
    const creatorPage = await (await browser.newContext()).newPage()
    await signIn(creatorPage, creator.person, "/cabinet")
    await expect(creatorPage.getByText("Фото не ваши.")).toBeVisible()

    // After the fix the creator sends it again and the moderator approves it.
    await creator.api.ok(creator.api.post("/me/creator-profile/submit"), 200)
    await page.goto(`/admin/moderation/${creator.creatorId}`)
    const pending = page.getByRole("button", { name: /Одобрить всё ожидающее/ })
    if (await pending.isVisible()) await pending.click()
    await page.getByRole("button", { name: "Одобрить витрину" }).click()
    await expect(page.getByText("Опубликована")).toBeVisible()

    const anonymous = await Api.anonymous()
    expect((await anonymous.get(`/creators/${creator.creatorId}`)).status()).toBe(200)
    await anonymous.dispose()
    await creatorPage.context().close()
  })

  test("a suspended showcase disappears from the public pages and comes back when the suspension is lifted (AC-17)", async ({ page }) => {
    const creator = await prepareCreator("suspend", { publish: true })
    const anonymous = await Api.anonymous()
    expect((await anonymous.get(`/creators/${creator.creatorId}`)).status()).toBe(200)

    await signIn(page, ADMIN, `/admin/moderation/${creator.creatorId}`)
    await page.getByRole("button", { name: "Приостановить витрину…" }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Причина").fill("Нарушение правил.")
    await dialog.getByRole("button", { name: "Приостановить", exact: true }).click()
    await expect(page.getByRole("button", { name: "Снять приостановку витрины" })).toBeVisible()
    expect((await anonymous.get(`/creators/${creator.creatorId}`)).status()).toBe(404)

    await page.getByRole("button", { name: "Снять приостановку витрины" }).click()
    await expect(page.getByRole("button", { name: "Приостановить витрину…" })).toBeVisible()
    expect((await anonymous.get(`/creators/${creator.creatorId}`)).status()).toBe(200)
    await anonymous.dispose()
  })

  test("the administration answers a buyer with 'no access', and the API with 403 (AC-40 (б))", async ({ page }) => {
    const buyer = newPerson("buyer")
    await registerConfirmed(buyer)
    await signIn(page, buyer, "/admin/moderation")
    await expect(page.getByText("У вас нет доступа к этой странице.")).toBeVisible()

    const api = await Api.login(buyer.email, buyer.password)
    expect((await api.get("/admin/moderation/queue")).status()).toBe(403)
    expect((await api.get("/admin/metrics/inquiries")).status()).toBe(403)
    await api.dispose()
  })

  test("the metrics page shows the numbers of the pilot (AC-37)", async ({ page }) => {
    await prepareCreator("metrics", { publish: true })
    await signIn(page, ADMIN, "/admin/metrics")
    await expect(page.getByRole("heading", { name: "Метрики" })).toBeVisible()
    await expect(page.getByText("Активных витрин").first()).toBeVisible()
    const admin = await adminApi()
    const showcases = await admin.ok<{ byStatus: { status: string; count: number }[] }>(admin.get("/admin/metrics/showcases"))
    await admin.dispose()
    const published = showcases.byStatus.find((entry) => entry.status === "PUBLISHED")?.count ?? 0
    expect(published).toBeGreaterThan(0)
    await expect(page.getByRole("row", { name: new RegExp(`Опубликована\\s+${published}`) })).toBeVisible()
  })
})
