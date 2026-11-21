import { expect, test } from "@playwright/test"
import { Api, PASSWORD, newPerson, prepareCreator, registerConfirmed, signIn } from "./support/world"

// AC-34 in the part of the web client: the deletion of the account, asked for on the page "Аккаунт" of the cabinet.
test.describe("deleting the account", () => {
  test("the question comes first, a refusal changes nothing, a yes ends the account and shows the farewell page (AC-34)", async ({ page }) => {
    const person = newPerson("leaving")
    await registerConfirmed(person)
    await signIn(page, person, "/cabinet/account")
    await expect(page.getByRole("navigation", { name: "Разделы кабинета" }).getByRole("link", { name: "Аккаунт" })).toHaveAttribute("aria-current", "page")
    await expect(page.getByText(person.email)).toBeVisible()

    const open = page.getByRole("button", { name: "Удалить аккаунт" })
    const dialog = page.getByRole("dialog", { name: "Удалить аккаунт?" })
    const confirm = dialog.getByRole("button", { name: "Удалить навсегда" })

    await open.click()
    await expect(confirm).toBeDisabled()
    await dialog.getByRole("button", { name: "Не удалять" }).click()
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/cabinet\/account$/)

    await open.click()
    await expect(confirm).toBeDisabled()
    await dialog.getByRole("checkbox").check()
    await confirm.click()

    await expect(page).toHaveURL(/\/account-deleted$/)
    await expect(page.getByRole("heading", { name: "Аккаунт удалён", level: 1 })).toBeVisible()
    await expect(page.getByRole("banner").getByRole("link", { name: "Войти" })).toBeVisible()

    const anonymous = await Api.anonymous()
    expect((await anonymous.post("/auth/login", { email: person.email, password: PASSWORD })).status()).toBe(401)
    await anonymous.dispose()
  })

  test("the page is in the menu of the account, and the showcase of a creator who left is no longer public (AC-34)", async ({ page }) => {
    const creator = await prepareCreator("gone", { publish: true })
    await signIn(page, creator.person, "/")
    await page.getByRole("button", { name: "Меню аккаунта" }).click()
    await page.getByRole("menuitem", { name: "Аккаунт" }).click()
    await expect(page).toHaveURL(/\/cabinet\/account$/)

    await page.getByRole("button", { name: "Удалить аккаунт" }).click()
    await page.getByRole("dialog").getByRole("checkbox").check()
    await page.getByRole("dialog").getByRole("button", { name: "Удалить навсегда" }).click()
    await expect(page).toHaveURL(/\/account-deleted$/)

    const anonymous = await Api.anonymous()
    await expect.poll(async () => (await anonymous.get(`/creators/${creator.creatorId}`)).status(), { timeout: 20_000 }).toBe(404)
    await anonymous.dispose()
  })
})
