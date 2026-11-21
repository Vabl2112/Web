import { expect, test } from "@playwright/test"
import { prepareCreator, signIn } from "./support/world"

// The header and the front page as in the first prototype: its sections, and the masters under the board of works.
test("the header has the sections of the prototype and the front page shows the masters under the board", async ({ page }) => {
  await prepareCreator("start", { publish: true })
  await page.goto("/")

  const header = page.getByRole("banner")
  for (const name of ["Мастера", "Фотогалерея", "Услуги и товары"]) {
    await expect(header.getByRole("link", { name })).toBeVisible()
  }
  await expect(page.getByRole("heading", { name: "Мастера", level: 2 })).toBeVisible()
  await expect(page.getByRole("link", { name: "Все мастера" })).toBeVisible()

  // Services and goods are one section: one menu item, one list.
  await expect(header.getByRole("link", { name: "Товары", exact: true })).toHaveCount(0)
  await header.getByRole("link", { name: "Услуги и товары" }).click()
  await expect(page).toHaveURL(/\/listings$/)
  await expect(page.getByRole("heading", { name: "Услуги и товары", level: 1 })).toBeVisible()
})

// The first front page was an opening block for a guest; a person who has signed in goes straight to the board.
test("a guest sees the opening block with the collage of real works, a signed-in person does not", async ({ page }) => {
  const creator = await prepareCreator("hero", { publish: true })
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Найди своего мастера", level: 1 })).toBeVisible()
  await expect(page.getByText("Платформа для творческих людей")).toBeVisible()
  await expect(page.getByRole("link", { name: "Найти мастера" })).toHaveAttribute("href", "/creators")
  await expect(page.getByRole("link", { name: "Начать продавать" })).toHaveAttribute("href", "/register")
  // The board of works is still there, under it; the collage is made of works of the gallery and each picture leads to a showcase.
  await expect(page.getByRole("heading", { name: "Найдите вдохновение", level: 2 })).toBeVisible()
  await expect(page.getByRole("link", { name: /^Витрина: / }).first()).toHaveAttribute("href", /^\/creators\/[0-9a-f-]{36}$/)

  await signIn(page, creator.person, "/")
  await expect(page.getByRole("heading", { name: "Найдите вдохновение", level: 1 })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Найди своего мастера" })).toHaveCount(0)
})
