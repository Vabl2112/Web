import { expect, test } from "@playwright/test"
import { prepareCreator } from "./support/world"

// The header and the front page as in the first prototype: its sections, and the masters under the board of works.
test("the header has the sections of the prototype and the front page shows the masters under the board", async ({ page }) => {
  await prepareCreator("start", { publish: true })
  await page.goto("/")

  const header = page.getByRole("banner")
  for (const name of ["Мастера", "Фотогалерея", "Услуги", "Товары"]) {
    await expect(header.getByRole("link", { name })).toBeVisible()
  }
  await expect(page.getByRole("heading", { name: "Мастера", level: 2 })).toBeVisible()
  await expect(page.getByRole("link", { name: "Все мастера" })).toBeVisible()

  // "Услуги" is the list of the listings of that type, with its own title.
  await header.getByRole("link", { name: "Услуги" }).click()
  await expect(page).toHaveURL(/\/listings\?type=SERVICE/)
  await expect(page.getByRole("heading", { name: "Услуги", level: 1 })).toBeVisible()
})
