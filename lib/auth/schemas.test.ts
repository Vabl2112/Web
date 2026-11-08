import { describe, expect, it } from "vitest"
import { forgotPasswordSchema, loginSchema, MIN_PASSWORD_LENGTH, registerSchema, resetPasswordSchema } from "./schemas"

// The first message of a field is the one a form shows.
function messagesOf(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  const messages: Record<string, string> = {}
  for (const issue of result.error?.issues ?? []) {
    messages[String(issue.path[0])] ??= issue.message
  }
  return messages
}

const registration = {
  email: "anna@example.org",
  name: "Anna",
  password: "correct horse battery",
  consent: true,
  adult: true,
}

describe("registerSchema", () => {
  it("takes a complete registration and trims the e-mail and the name", () => {
    const result = registerSchema.safeParse({ ...registration, email: "  anna@example.org ", name: " Anna " })

    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ email: "anna@example.org", name: "Anna" })
  })

  it("wants a password of at least ten characters", () => {
    const short = "x".repeat(MIN_PASSWORD_LENGTH - 1)

    expect(messagesOf(registerSchema.safeParse({ ...registration, password: short }))).toEqual({ password: "Не короче 10 символов." })
    expect(registerSchema.safeParse({ ...registration, password: "x".repeat(MIN_PASSWORD_LENGTH) }).success).toBe(true)
  })

  it("wants the consent and the confirmation of age (AC-08)", () => {
    const messages = messagesOf(registerSchema.safeParse({ ...registration, consent: false, adult: false }))

    expect(messages.consent).toBe("Нужно согласие на обработку персональных данных.")
    expect(messages.adult).toBe("Нужно подтвердить, что вам исполнилось 18 лет.")
  })

  it("wants a name and a valid e-mail", () => {
    const messages = messagesOf(registerSchema.safeParse({ ...registration, name: "   ", email: "anna" }))

    expect(messages).toEqual({ name: "Введите имя.", email: "Проверьте адрес почты." })
  })

  it("keeps the name within the limit of the contract", () => {
    expect(registerSchema.safeParse({ ...registration, name: "я".repeat(81) }).success).toBe(false)
    expect(registerSchema.safeParse({ ...registration, name: "я".repeat(80) }).success).toBe(true)
  })
})

describe("loginSchema", () => {
  it("does not judge the length of an old password, only that there is one", () => {
    expect(loginSchema.safeParse({ email: "anna@example.org", password: "short" }).success).toBe(true)
    expect(messagesOf(loginSchema.safeParse({ email: "anna@example.org", password: "" }))).toEqual({ password: "Введите пароль." })
  })
})

describe("forgotPasswordSchema", () => {
  it("wants an e-mail address", () => {
    expect(forgotPasswordSchema.safeParse({ email: "anna@example.org" }).success).toBe(true)
    expect(messagesOf(forgotPasswordSchema.safeParse({ email: "" }))).toEqual({ email: "Введите адрес почты." })
  })
})

describe("resetPasswordSchema", () => {
  it("wants the same new password twice", () => {
    expect(resetPasswordSchema.safeParse({ password: "another long passphrase", repeat: "another long passphrase" }).success).toBe(true)
    expect(messagesOf(resetPasswordSchema.safeParse({ password: "another long passphrase", repeat: "something else" }))).toEqual({
      repeat: "Пароли не совпадают.",
    })
  })

  it("applies the rule of the length to the new password", () => {
    expect(messagesOf(resetPasswordSchema.safeParse({ password: "short", repeat: "short" }))).toEqual({ password: "Не короче 10 символов." })
  })
})
