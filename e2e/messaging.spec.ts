import { expect, test } from "@playwright/test"
import { Api, messagingIsOn, newPerson, prepareCreator, registerConfirmed, signIn } from "./support/world"

// AC-18, AC-22, AC-23 and AC-26 in the part of the web client. Two browsers, as two people.
test("a buyer writes, the creator answers, and the answer shows up by itself (AC-18, AC-22, AC-23, AC-26)", async ({ browser }) => {
  test.skip(!(await messagingIsOn()), "messaging is off in this backend")
  const creator = await prepareCreator("talk", { publish: true })
  const buyer = newPerson("buyer")
  await registerConfirmed(buyer)

  const buyerContext = await browser.newContext()
  const buyerPage = await buyerContext.newPage()
  const creatorContext = await browser.newContext()
  const creatorPage = await creatorContext.newPage()
  const sockets: string[] = []
  for (const page of [buyerPage, creatorPage]) page.on("websocket", (socket) => sockets.push(socket.url()))

  // A guest who presses "Написать" signs in and comes back to the open form (AC-18).
  await buyerPage.goto(`/creators/${creator.creatorId}`)
  await buyerPage.getByRole("link", { name: "Написать" }).click()
  await expect(buyerPage).toHaveURL(/\/login\?returnTo=.*write%3D1/)
  await buyerPage.getByLabel("Почта").fill(buyer.email)
  await buyerPage.getByLabel("Пароль").fill(buyer.password)
  await buyerPage.getByRole("button", { name: "Войти" }).click()
  await expect(buyerPage).toHaveURL(new RegExp(`/creators/${creator.creatorId}`))
  const form = buyerPage.getByRole("dialog")
  await expect(form).toBeVisible()
  await form.getByLabel("Напишите сообщение").fill("Здравствуйте! Кружка ещё есть?")
  await form.getByRole("button", { name: "Отправить" }).click()
  await expect(buyerPage).toHaveURL(/\/messages\/[0-9a-f-]{36}$/)
  await expect(buyerPage.getByText("Здравствуйте! Кружка ещё есть?")).toBeVisible()

  // The creator finds the conversation in the cabinet with one unread, opens it and answers.
  await signIn(creatorPage, creator.person, "/cabinet/messages")
  const row = creatorPage.getByRole("link", { name: new RegExp(buyer.name) })
  await expect(row).toContainText("1")
  await row.click()
  await expect(creatorPage.getByText("Здравствуйте! Кружка ещё есть?")).toBeVisible()
  await creatorPage.getByLabel("Напишите сообщение").fill("Да, в наличии.")
  await creatorPage.getByRole("button", { name: "Отправить" }).click()
  await expect(creatorPage.getByText("Да, в наличии.")).toBeVisible()

  // The buyer did nothing: the answer comes by polling in at most 10 s (AC-22), and what the creator read counts as read (AC-23).
  await expect(buyerPage.getByText("Да, в наличии.")).toBeVisible({ timeout: 10_000 })
  const creatorApi = await Api.login(creator.person.email, creator.person.password)
  await expect
    .poll(async () => (await creatorApi.ok<{ unreadMessages: number }>(creatorApi.get("/me/inbox/summary"))).unreadMessages, { timeout: 10_000 })
    .toBe(0)
  await creatorApi.dispose()

  expect(sockets, "the web client keeps no long-lived connection (AC-26)").toEqual([])
  await Promise.all([buyerContext.close(), creatorContext.close()])
})
