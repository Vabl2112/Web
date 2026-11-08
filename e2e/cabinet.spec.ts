import { expect, test } from "@playwright/test"
import { heavyPng, solidPng } from "./support/image"
import { Api, newPerson, registerConfirmed, signIn } from "./support/world"

// AC-13, AC-14, AC-16 and AC-42 in the part of the web client.
test.describe("the cabinet of a creator", () => {
  test("a person becomes a creator, fills the showcase and sends it to review (AC-13, AC-14)", async ({ page }) => {
    const person = newPerson("cabinet")
    await registerConfirmed(person)
    await signIn(page, person, "/cabinet")

    await page.getByRole("button", { name: "Стать создателем" }).click()
    await expect(page).toHaveURL(/\/cabinet\/profile$/)
    await page.getByLabel("Название витрины").fill(`Студия ${person.name}`)
    await page.getByLabel("Категория").selectOption({ index: 1 })
    await page.getByLabel("О себе").fill("Делаю вещи руками.")
    await page.getByLabel("Теги").fill("кружки, ручная работа")
    await page.getByRole("button", { name: "Сохранить" }).click()
    await expect(page.getByText("Сохранено.")).toBeVisible()

    // Without the minimum the checklist names exactly what is missing and the button is off (AC-14).
    await page.goto("/cabinet")
    await expect(page.getByRole("link", { name: "Добавьте хотя бы одну позицию" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Добавьте не менее трёх работ в портфолио" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Отправить на проверку" })).toBeDisabled()

    await page.goto("/cabinet/listings")
    await page.getByRole("button", { name: "Добавить позицию" }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Название").fill("Кружка ручной работы")
    await dialog.getByLabel("Категория").selectOption({ index: 1 })
    await dialog.getByLabel("Цена от, ₽").fill("2 500")
    await dialog.getByRole("button", { name: "Сохранить" }).click()
    await expect(page.getByText("от 2 500 ₽")).toBeVisible()
    await page.locator('input[type="file"]').first().setInputFiles(solidPng("mug", [47, 111, 143]))
    await expect(page.locator("main ul ul img")).toHaveCount(1)

    await page.goto("/cabinet/portfolio")
    for (const [index, color] of ([[143, 47, 79], [79, 143, 47], [143, 111, 47]] as [number, number, number][]).entries()) {
      await page.locator('input[type="file"]').first().setInputFiles(solidPng(`work${index}`, color))
      await page.getByLabel("Категория").selectOption({ index: 1 })
      await page.getByRole("button", { name: "Добавить", exact: true }).click()
      await expect(page.locator("main ul img")).toHaveCount(index + 1)
    }

    await page.goto("/cabinet")
    await expect(page.getByText("Всё готово: витрину можно отправить на проверку.")).toBeVisible()
    await page.getByRole("button", { name: "Отправить на проверку" }).click()
    await expect(page.getByText("Витрина на проверке")).toBeVisible()

    // The content waits for the moderators: the showcase is not public yet.
    const anonymous = await Api.anonymous()
    const creator = await Api.login(person.email, person.password)
    const mine = await creator.ok<{ id: string; status: string }>(creator.get("/me/creator-profile"))
    expect(mine.status).toBe("PENDING_REVIEW")
    expect((await anonymous.get(`/creators/${mine.id}`)).status()).toBe(404)
    await Promise.all([anonymous.dispose(), creator.dispose()])
  })

  test("an image of 9.9 MB is accepted and one of 10.5 MB is refused as a problem document (AC-42)", async () => {
    const person = newPerson("upload")
    await registerConfirmed(person)
    const api = await Api.login(person.email, person.password)
    await api.ok(api.post("/me/creator-profile", {}), 201)

    const accepted = await api.uploadRaw(heavyPng("big", 9.9))
    expect(accepted.status(), await accepted.text()).toBe(201)

    const refused = await api.uploadRaw(heavyPng("huge", 10.5))
    expect(refused.status()).toBe(413)
    expect(refused.headers()["content-type"]).toContain("application/problem+json")
    expect(await refused.json()).toMatchObject({ status: 413 })
    await api.dispose()
  })
})
