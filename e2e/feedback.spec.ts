import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { ADMIN, Api, adminApi, messagingIsOn, newPerson, prepareCreator, registerConfirmed, signIn } from "./support/world"

// AC-47, AC-48 and AC-49 in the part of the web client: the stars and the feedback, the mark "Проверен", the order by rating.
test("a person leaves feedback after the creator has answered, the stars show on the page and the list, and an administrator sets the mark (AC-47, AC-48, AC-49)", async ({
  page,
  browser,
}) => {
  test.skip(!(await messagingIsOn()), "feedback needs a conversation, and messaging is off in this backend")
  await (await adminApi()).dispose()
  const creator = await prepareCreator("stars", { publish: true })
  const buyer = newPerson("buyer")
  await registerConfirmed(buyer)
  const buyerApi = await Api.login(buyer.email, buyer.password)

  // Without a conversation there is no form, only the way to get one.
  await signIn(page, buyer, `/creators/${creator.creatorId}`)
  await page.getByRole("tab", { name: "Отзывы" }).click()
  await expect(page.getByText("Пока нет отзывов.")).toBeVisible()
  await expect(page.getByText(/Оставить отзыв можно после переписки с мастером/)).toBeVisible()

  // The buyer writes and the creator answers (through the API); then the form is there.
  const conversation = await buyerApi.ok<{ id: string }>(
    buyerApi.post("/conversations", { creatorId: creator.creatorId, text: "Здравствуйте!", clientMessageId: randomUUID() }),
  )
  await creator.api.ok(creator.api.post(`/conversations/${conversation.id}/messages`, { text: "Добрый день!", clientMessageId: randomUUID() }))
  await page.reload()
  await page.getByRole("tab", { name: "Отзывы" }).click()
  await page.getByRole("button", { name: "Оценка 5 из 5" }).click()
  await page.getByLabel("Текст отзыва (необязательно)").fill("Быстро ответил и всё сделал.")
  await page.getByRole("button", { name: "Отправить отзыв" }).click()
  await expect(page.getByText("Ваш отзыв")).toBeVisible()
  await expect(page.getByText("(1 отзыв)")).toBeVisible()
  await expect(page.getByRole("tab", { name: "Отзывы (1)" })).toBeVisible()

  // A guest sees the stars on the card, in the list ordered by rating, and the feedback of the tab.
  const guest = await browser.newPage()
  await guest.goto("/creators?sort=RATING")
  await expect(guest.getByRole("link", { name: "По рейтингу" })).toHaveAttribute("aria-current", "true")
  const card = guest.getByRole("article").filter({ hasText: creator.displayName })
  await expect(card).toContainText("(1 отзыв)")
  await guest.goto(`/creators/${creator.creatorId}`)
  await guest.getByRole("tab", { name: /^Отзывы/ }).click()
  await expect(guest.getByText("Быстро ответил и всё сделал.")).toBeVisible()
  await expect(guest.getByText("Проверен")).toHaveCount(0)

  // The creator gives the year they started in the cabinet; the showcase shows the experience (AC-48).
  const creatorPage = await browser.newPage()
  await signIn(creatorPage, creator.person, "/cabinet/profile")
  await creatorPage.getByLabel("Год начала работы").fill("2016")
  await creatorPage.getByRole("button", { name: "Сохранить" }).click()
  await expect(creatorPage.getByText("Сохранено.")).toBeVisible()
  await guest.reload()
  await expect(guest.getByText(/Опыт \d+ (год|года|лет)/)).toBeVisible()
  await creatorPage.getByLabel("Год начала работы").fill("2999")
  await creatorPage.getByRole("button", { name: "Сохранить" }).click()
  await expect(creatorPage.getByText("Год от 1950 до")).toBeVisible()
  await creatorPage.close()

  // An administrator sets the mark; it shows to the guest at once.
  const adminPage = await browser.newPage()
  await signIn(adminPage, ADMIN, `/admin/moderation/${creator.creatorId}`)
  await adminPage.getByRole("button", { name: "Отметить как проверенного" }).click()
  await expect(adminPage.getByRole("button", { name: "Снять отметку" })).toBeVisible()
  await guest.reload()
  await expect(guest.getByText("Проверен")).toBeVisible()

  // The author deletes the feedback, and the stars go with it.
  await page.getByRole("button", { name: "Удалить мой отзыв" }).click()
  await page.getByRole("button", { name: "Да, удалить" }).click()
  await expect(page.getByText("Оставить отзыв", { exact: true })).toBeVisible()
  await expect(page.getByText("Пока нет отзывов").first()).toBeVisible()
  await buyerApi.dispose()
  await guest.close()
  await adminPage.close()
})
