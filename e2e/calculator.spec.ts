import { expect, test } from "@playwright/test"
import { BASE_URL, prepareCreator, signIn } from "./support/world"

// AC-46 in the part of the web client, and the front page as a board of works (ADR 0018).
test.describe("the price calculator", () => {
  test("a creator sets it in the cabinet and a visitor counts a price on the showcase (AC-46)", async ({ page, browser }) => {
    const creator = await prepareCreator("calc", { publish: true })
    await signIn(page, creator.person, "/cabinet/calculator")
    await expect(page.getByRole("heading", { name: "Калькулятор цены" })).toBeVisible()

    // The starter is a sound calculator: it is saved as it is.
    await page.getByRole("button", { name: "Сохранить калькулятор" }).click()
    await expect(page.getByText("Калькулятор сохранён")).toBeVisible()

    const guest = await browser.newPage({ baseURL: BASE_URL })
    await guest.goto(`/creators/${creator.creatorId}`)
    await guest.getByRole("tab", { name: "Калькулятор" }).click()
    await expect(guest.getByText(/≈/)).toContainText(/1[\s  ]000/)

    await guest.getByText("Сложная", { exact: true }).click()
    await expect(guest.getByText(/≈/)).toContainText(/2[\s  ]000/)
    await guest.close()
  })

  test("a formula that does not read is shown at once and refused on save (AC-46)", async ({ page }) => {
    const creator = await prepareCreator("calc-bad", { publish: true })
    await signIn(page, creator.person, "/cabinet/calculator")

    await page.getByLabel("Формула цены").fill("amount *")
    await expect(page.getByText("Формулу не удалось прочитать")).toBeVisible()
    await page.getByRole("button", { name: "Сохранить калькулятор" }).click()
    await expect(page.getByText("Проверьте поля, отмеченные красным.")).toBeVisible()

    const guest = await page.context().browser()!.newPage({ baseURL: BASE_URL })
    await guest.goto(`/creators/${creator.creatorId}`)
    await expect(guest.getByRole("tab", { name: "Калькулятор" })).toHaveCount(0)
    await guest.close()
  })

  test("a creator removes the calculator and the tab is gone (AC-46)", async ({ page }) => {
    const creator = await prepareCreator("calc-off", { publish: true })
    await signIn(page, creator.person, "/cabinet/calculator")
    await page.getByRole("button", { name: "Сохранить калькулятор" }).click()
    await expect(page.getByText("Калькулятор сохранён")).toBeVisible()

    await page.getByRole("button", { name: "Убрать калькулятор" }).click()
    await page.getByRole("button", { name: "Да, убрать" }).click()
    await expect(page.getByText("Калькулятор убран с витрины.")).toBeVisible()

    await page.goto(`/creators/${creator.creatorId}`)
    await expect(page.getByRole("tab", { name: "Калькулятор" })).toHaveCount(0)
    await expect(page.getByRole("tab", { name: "Портфолио" })).toBeVisible()
  })
})

test.describe("the front page", () => {
  test("is a board of works, and a work leads to its showcase", async ({ page }) => {
    const creator = await prepareCreator("front", { publish: true })

    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Найдите вдохновение" })).toBeVisible()
    await expect(page.getByRole("navigation", { name: "Категории" })).toBeVisible()
    const tile = page.locator(`a[href="/creators/${creator.creatorId}"]`).first()
    await expect(tile).toBeVisible()
    await tile.click()
    await expect(page).toHaveURL(new RegExp(`/creators/${creator.creatorId}$`))
  })
})
