import { expect, test } from "@playwright/test"
import { prepareCreator, signIn } from "./support/world"

// The header as in the first prototype, and the front page of a signed-in person: the board of works with the masters under it.
test("the header has the sections of the prototype and the board of a signed-in person shows the masters under the works", async ({ page }) => {
  const creator = await prepareCreator("start", { publish: true })
  await signIn(page, creator.person, "/")

  const header = page.getByRole("banner")
  for (const name of ["Мастера", "Фотогалерея", "Услуги и товары"]) {
    await expect(header.getByRole("link", { name })).toBeVisible()
  }
  await expect(page.getByRole("heading", { name: "Мастера", exact: true, level: 2 })).toBeVisible()
  await expect(page.getByRole("link", { name: "Все мастера" })).toBeVisible()

  // Services and goods are one section: one menu item, one list.
  await expect(header.getByRole("link", { name: "Товары", exact: true })).toHaveCount(0)
  await header.getByRole("link", { name: "Услуги и товары" }).click()
  await expect(page).toHaveURL(/\/listings$/)
  await expect(page.getByRole("heading", { name: "Услуги и товары", level: 1 })).toBeVisible()
})

// The first front page: a guest gets the landing made of real works and masters, a person who has signed in gets the board.
test("a guest gets the landing of the first front page, a signed-in person the board of works", async ({ page }) => {
  const creator = await prepareCreator("landing", { publish: true })
  await page.goto("/")

  await expect(page.getByRole("heading", { name: "Найди своего мастера", level: 1 })).toBeVisible()
  await expect(page.getByText("Платформа для творческих людей")).toBeVisible()
  const main = page.getByRole("main")
  await expect(main.getByRole("link", { name: "Найти мастера" })).toHaveAttribute("href", "/creators")
  await expect(main.getByRole("link", { name: "Начать продавать" })).toHaveAttribute("href", "/register")
  for (const name of ["Почему выбирают EGG", "Лучшие мастера", "Галерея работ", "Присоединяйтесь к EGG"]) {
    await expect(page.getByRole("heading", { name, level: 2 })).toBeVisible()
  }
  // The collage and the gallery are works of the gallery, each leading to its showcase; the numbers of the first page are not drawn.
  await expect(page.getByRole("link", { name: /^Витрина: / }).first()).toHaveAttribute("href", /^\/creators\/[0-9a-f-]{36}$/)
  await expect(page.getByRole("link", { name: /^Работа: / }).first()).toHaveAttribute("href", /^\/creators\/[0-9a-f-]{36}$/)
  await expect(page.getByText("Довольных клиентов")).toHaveCount(0)
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "Условия использования" }).first()).toBeVisible()
  await expect(page.getByRole("heading", { name: "Найдите вдохновение" })).toHaveCount(0)

  await signIn(page, creator.person, "/")
  await expect(page.getByRole("heading", { name: "Найдите вдохновение", level: 1 })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Найди своего мастера" })).toHaveCount(0)
})
