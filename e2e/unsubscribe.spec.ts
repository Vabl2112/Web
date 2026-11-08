import { randomUUID } from "node:crypto"
import { expect, test } from "@playwright/test"
import { linkTo, waitForMail } from "./support/mail"
import { Api, messagingIsOn, newPerson, prepareCreator, registerConfirmed } from "./support/world"

// AC-24 in the part of the web client: a link in a mail only shows the page, the button unsubscribes.
test("opening the link of a mail does not unsubscribe, the button does (AC-24)", async ({ page }) => {
  test.skip(!(await messagingIsOn()), "messaging is off in this backend")
  const creator = await prepareCreator("unsub", { publish: true })
  const buyer = newPerson("buyer")
  await registerConfirmed(buyer)
  const buyerApi = await Api.login(buyer.email, buyer.password)
  await buyerApi.ok(buyerApi.post("/conversations", { creatorId: creator.creatorId, text: "Здравствуйте!", clientMessageId: randomUUID() }), [200, 201])

  const mail = await waitForMail(creator.person.email, /Новое сообщение/)
  const link = linkTo(mail, "/unsubscribe")

  const posts: string[] = []
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().includes("/notifications/unsubscribe")) posts.push(request.url())
  })

  await page.goto(link)
  await expect(page.getByRole("button", { name: "Отписаться" })).toBeVisible()
  await page.waitForTimeout(1500)
  expect(posts, "opening the page must not send anything").toHaveLength(0)
  const before = await creator.api.ok<{ newMessage: boolean }>(creator.api.get("/me/notification-settings"))
  expect(before.newMessage).toBe(true)

  await page.getByRole("button", { name: "Отписаться" }).click()
  await expect(page.getByText("мы больше не будем присылать письма о новых сообщениях")).toBeVisible()
  expect(posts).toHaveLength(1)
  const after = await creator.api.ok<{ newMessage: boolean }>(creator.api.get("/me/notification-settings"))
  expect(after.newMessage).toBe(false)
})
