import { expect, test } from "@playwright/test"
import { linkTo, waitForMail } from "./support/mail"
import { Api, newPerson, PASSWORD, registerConfirmed, signIn } from "./support/world"

// AC-08 to AC-11 (registration, confirmation, login, reset), AC-38 (а, г) and AC-40 (а) in the part that the web client owns.
test.describe("registration and sign-in", () => {
  test("a guest is sent from a private page to the login page and comes back after the sign-in (AC-40 (а))", async ({ page }) => {
    const person = newPerson("login")
    await registerConfirmed(person)

    await page.goto("/cabinet")
    await expect(page).toHaveURL(/\/login\?returnTo=%2Fcabinet$/)

    await page.getByLabel("Почта").fill(person.email)
    await page.getByLabel("Пароль").fill("a wrong password")
    await page.getByRole("button", { name: "Войти" }).click()
    await expect(page.getByText("Неверная почта или пароль.")).toBeVisible()
    await expect(page).toHaveURL(/\/login/)

    await page.getByLabel("Пароль").fill(person.password)
    await page.getByRole("button", { name: "Войти" }).click()
    await expect(page).toHaveURL(/\/cabinet$/)
    await expect(page.getByText("Станьте создателем")).toBeVisible()
  })

  test("registration needs the consent and the age, refuses a common password and confirms the address by the link (AC-08, AC-10)", async ({ page }) => {
    const person = newPerson("register")
    await page.goto("/register")
    await page.getByLabel("Имя").fill(person.name)
    await page.getByLabel("Почта").fill(person.email)
    await page.getByLabel("Пароль").fill("password123")

    await page.getByRole("button", { name: "Зарегистрироваться" }).click()
    await expect(page.getByText("Нужно согласие на обработку персональных данных.")).toBeVisible()
    await expect(page.getByText("Нужно подтвердить, что вам исполнилось 18 лет.")).toBeVisible()

    await page.getByRole("checkbox", { name: /Я принимаю/ }).click()
    await page.getByRole("checkbox", { name: /18 лет/ }).click()
    await page.getByRole("button", { name: "Зарегистрироваться" }).click()
    await expect(page.getByText("Этот пароль слишком распространён. Придумайте другой.")).toBeVisible()

    await page.getByLabel("Пароль").fill(person.password)
    await page.getByRole("button", { name: "Зарегистрироваться" }).click()
    await expect(page).toHaveURL(/\/verify-email$/)

    const mail = await waitForMail(person.email, /Подтвердите/)
    const link = linkTo(mail, "/verify-email")
    await page.goto(link)
    await expect(page.getByText("Адрес почты подтверждён.")).toBeVisible()

    // The token is spent: the same link says so and changes nothing.
    await page.goto(link)
    await expect(page.getByText("Ссылка недействительна или устарела.")).toBeVisible()
  })

  test("an address that is already registered is told so (AC-08)", async ({ page }) => {
    const person = newPerson("taken")
    await registerConfirmed(person)

    await page.goto("/register")
    await page.getByLabel("Имя").fill(person.name)
    await page.getByLabel("Почта").fill(person.email)
    await page.getByLabel("Пароль").fill(person.password)
    await page.getByRole("checkbox", { name: /Я принимаю/ }).click()
    await page.getByRole("checkbox", { name: /18 лет/ }).click()
    await page.getByRole("button", { name: "Зарегистрироваться" }).click()

    await expect(page.getByText("Этот адрес уже зарегистрирован.")).toBeVisible()
  })

  test("a forgotten password is reset by the link of the mail, and the old password stops working (AC-09, AC-11)", async ({ page }) => {
    const person = newPerson("reset")
    await registerConfirmed(person)

    // The page says the same for an address that exists and one that does not.
    for (const email of ["nobody-" + person.email, person.email]) {
      await page.goto("/forgot-password")
      await page.getByLabel("Почта").fill(email)
      await page.getByRole("button", { name: "Отправить ссылку" }).click()
      await expect(page.getByText("Если этот адрес зарегистрирован")).toBeVisible()
    }

    const mail = await waitForMail(person.email, /Сброс пароля/)
    await page.goto(linkTo(mail, "/reset-password"))
    await page.getByLabel("Новый пароль", { exact: true }).fill("another long passphrase")
    await page.getByLabel("Повторите пароль").fill("another long passphrase")
    await page.getByRole("button", { name: "Сохранить пароль" }).click()
    await expect(page.getByText("Пароль изменён.")).toBeVisible()

    const anonymous = await Api.anonymous()
    expect((await anonymous.post("/auth/login", { email: person.email, password: PASSWORD })).status()).toBe(401)
    await anonymous.dispose()
    await signIn(page, { email: person.email, password: "another long passphrase" }, "/cabinet")
  })
})
