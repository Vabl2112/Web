import { randomUUID } from "node:crypto"
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
  await expect(buyerPage).toHaveURL(new RegExp(`/login\\?returnTo=.*write%3D${creator.creatorId}`))
  await buyerPage.getByLabel("Почта").fill(buyer.email)
  await buyerPage.getByLabel("Пароль").fill(buyer.password)
  await buyerPage.getByRole("button", { name: "Войти" }).click()
  await expect(buyerPage).toHaveURL(new RegExp(`/creators/${creator.creatorId}`))
  const form = buyerPage.getByRole("dialog")
  await expect(form).toBeVisible()
  await form.getByLabel("Напишите сообщение").fill("Здравствуйте! Кружка ещё есть?")
  await form.getByRole("button", { name: "Отправить" }).click()
  // The conversation opens in the chat window over the showcase, not on a page of its own (ADR 0019).
  const buyerChat = buyerPage.getByRole("dialog", { name: "Сообщения" })
  await expect(buyerChat.getByText("Здравствуйте! Кружка ещё есть?")).toBeVisible()
  await expect(buyerPage).toHaveURL(new RegExp(`/creators/${creator.creatorId}`))

  // The creator finds the conversation in the window, opened from the cabinet, with one unread, opens it and answers.
  await signIn(creatorPage, creator.person, "/cabinet")
  await creatorPage.getByRole("navigation", { name: "Разделы кабинета" }).getByRole("button", { name: /^Сообщения/ }).click()
  const creatorChat = creatorPage.getByRole("dialog", { name: "Сообщения" })
  const row = creatorChat.getByRole("button", { name: new RegExp(buyer.name) })
  await expect(row).toContainText("1")
  await row.click()
  await expect(creatorChat.getByText("Здравствуйте! Кружка ещё есть?")).toBeVisible()
  await creatorChat.getByLabel("Напишите сообщение").fill("Да, в наличии.")
  await creatorChat.getByRole("button", { name: "Отправить" }).click()
  await expect(creatorChat.getByText("Да, в наличии.")).toBeVisible()

  // The buyer did nothing: the answer comes by polling in at most 10 s (AC-22), and what the creator read counts as read (AC-23).
  await expect(buyerChat.getByText("Да, в наличии.")).toBeVisible({ timeout: 10_000 })
  const creatorApi = await Api.login(creator.person.email, creator.person.password)
  await expect
    .poll(async () => (await creatorApi.ok<{ unreadMessages: number }>(creatorApi.get("/me/inbox/summary"))).unreadMessages, { timeout: 10_000 })
    .toBe(0)
  await creatorApi.dispose()

  expect(sockets, "the web client keeps no long-lived connection (AC-26)").toEqual([])
  await Promise.all([buyerContext.close(), creatorContext.close()])
})

// Backend ADR 0016: nothing can be written to a conversation whose other side deleted the account. The history stays readable, the thread
// shows a note instead of the box to write in, and the API refuses the message in any case.
test("when the other side deleted the account the thread shows a note and no box to write in (ADR 0016)", async ({ page }) => {
  test.skip(!(await messagingIsOn()), "messaging is off in this backend")
  const creator = await prepareCreator("gone", { publish: true })
  const buyer = newPerson("buyer")
  await registerConfirmed(buyer)
  const buyerApi = await Api.login(buyer.email, buyer.password)
  const conversation = await buyerApi.ok<{ id: string }>(
    buyerApi.post("/conversations", { creatorId: creator.creatorId, text: "Здравствуйте! Вы ещё работаете?", clientMessageId: randomUUID() }),
  )

  await creator.api.ok(creator.api.delete("/me"), 204)

  await signIn(page, buyer)
  await page.getByRole("button", { name: /^Сообщения/ }).click()
  const chat = page.getByRole("dialog", { name: "Сообщения" })
  await chat.getByRole("button", { name: /Здравствуйте! Вы ещё работаете\?/ }).click()
  await expect(chat.getByText("Здравствуйте! Вы ещё работаете?")).toBeVisible()
  await expect(chat.getByText("Собеседник удалил аккаунт")).toBeVisible()
  await expect(chat.getByLabel("Напишите сообщение")).toHaveCount(0)

  const refused = await buyerApi.post(`/conversations/${conversation.id}/messages`, { text: "Ещё раз", clientMessageId: randomUUID() })
  expect(refused.status()).toBe(409)
  expect((await refused.json()).code).toBe("COUNTERPART_DELETED")
  await buyerApi.dispose()
})

// The link of the e-mail about a new message (`/messages/{id}`, `/cabinet/messages/{id}`) is not a page any more: it opens the chat window.
test("the address of a conversation from an e-mail opens the chat window on it (ADR 0019)", async ({ page }) => {
  test.skip(!(await messagingIsOn()), "messaging is off in this backend")
  const creator = await prepareCreator("mail-link", { publish: true })
  const buyer = newPerson("buyer")
  await registerConfirmed(buyer)
  const buyerApi = await Api.login(buyer.email, buyer.password)
  const conversation = await buyerApi.ok<{ id: string }>(
    buyerApi.post("/conversations", { creatorId: creator.creatorId, text: "Добрый день! Принимаете заказы?", clientMessageId: randomUUID() }),
  )
  await buyerApi.dispose()

  await signIn(page, buyer)
  await page.goto(`/messages/${conversation.id}`)
  const chat = page.getByRole("dialog", { name: "Сообщения" })
  await expect(chat.getByText("Добрый день! Принимаете заказы?")).toBeVisible()
  await expect(page).toHaveURL(/\/$/)

  // "Все диалоги" leads back to the list, and closing the window leaves the page as it is.
  await chat.getByRole("button", { name: "Все диалоги" }).click()
  await expect(chat.getByRole("button", { name: /Добрый день! Принимаете заказы\?/ })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(chat).toHaveCount(0)
})
