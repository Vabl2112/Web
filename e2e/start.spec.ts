import { expect, test } from "@playwright/test"
import { newPerson, prepareCreator, registerConfirmed, signIn } from "./support/world"

// The header as in the first prototype: its sections; services and goods are one of them.
test("the header has the sections of the prototype", async ({ page }) => {
  await page.goto("/")

  const header = page.getByRole("banner")
  for (const name of ["Мастера", "Фотогалерея", "Услуги и товары"]) {
    await expect(header.getByRole("link", { name })).toBeVisible()
  }
  await expect(header.getByRole("link", { name: "Товары", exact: true })).toHaveCount(0)
  await header.getByRole("link", { name: "Услуги и товары" }).click()
  await expect(page).toHaveURL(/\/listings$/)
  await expect(page.getByRole("heading", { name: "Услуги и товары", level: 1 })).toBeVisible()
})

// The front page of the first web: a guest gets the landing made of real works and masters.
test("a guest gets the landing of the first front page", async ({ page }) => {
  await prepareCreator("landing", { publish: true })
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
})

// After the sign-in, as in the first web: a master goes to his or her own page, a buyer gets the place of the feed.
test("a signed-in master goes to the own showcase, a buyer gets the place of the feed", async ({ page }) => {
  const creator = await prepareCreator("home-master", { publish: true })
  // Signed in on another page first: "/" sends a master on at once, and the helper waits for the address it was given.
  await signIn(page, creator.person, "/gallery")
  await page.goto("/")
  await expect(page).toHaveURL(new RegExp(`/creators/${creator.creatorId}$`))

  await page.context().clearCookies()
  const buyer = newPerson("home-buyer")
  await registerConfirmed(buyer)
  await signIn(page, buyer, "/")
  await expect(page.getByRole("heading", { name: "Здесь будет ваша лента", level: 1 })).toBeVisible()
  await expect(page.getByRole("main").getByRole("link", { name: "Фотогалерея" })).toHaveAttribute("href", "/gallery")
  await expect(page.getByRole("heading", { name: "Найди своего мастера" })).toHaveCount(0)
})

// The board with a category used to be the front page: such an address now opens the gallery.
test("an old address of the front page with a category opens the gallery", async ({ page }) => {
  await page.goto("/?categoryId=0192f1c6-2222-7000-8000-000000000001")
  await expect(page).toHaveURL(/\/gallery\?categoryId=0192f1c6-2222-7000-8000-000000000001$/)
})
