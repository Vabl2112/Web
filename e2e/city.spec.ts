import { expect, test } from "@playwright/test"
import { Api, prepareCreator, publishCreator, signIn } from "./support/world"

// AC-02 in the part of the web client: a city is chosen in the cabinet and the lists filter by it.
test("a creator chooses a city, and the catalog can be filtered by it (AC-02)", async ({ page, request }) => {
  const creator = await prepareCreator("city")
  await signIn(page, creator.person, "/cabinet/profile")
  await page.getByLabel("Город").fill("Казан")
  await page.getByRole("button", { name: /^Казань/ }).click()
  await expect(page.getByText(/Казань, Татарстан/)).toBeVisible()
  await page.getByRole("button", { name: "Сохранить" }).click()
  await expect(page.getByText("Сохранено.")).toBeVisible()
  await publishCreator(creator)

  const anonymous = await Api.anonymous()
  const profile = await anonymous.ok<{ city?: { name: string } }>(anonymous.get(`/creators/${creator.creatorId}`))
  await anonymous.dispose()
  expect(profile.city?.name).toBe("Казань")

  // The filter is in the address, so a filtered page can be shared; without a city the page shows every showcase.
  await page.goto(`/creators?q=${encodeURIComponent(creator.person.name)}`)
  await page.getByLabel("Город").fill("Казан")
  await page.getByRole("button", { name: /^Казань/ }).click()
  await expect(page).toHaveURL(/cityId=[0-9a-f-]{36}/)
  await expect(page.getByText("Город: Казань")).toBeVisible()
  await expect(page.getByRole("link", { name: new RegExp(creator.displayName) })).toBeVisible()
  const html = await (await request.get(page.url())).text()
  expect(html, "the filtered list as the server sends it").toContain(creator.displayName)

  await page.getByRole("link", { name: "Сбросить" }).click()
  await expect(page).not.toHaveURL(/cityId=/)
})
