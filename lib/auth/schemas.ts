import { z } from "zod"

/** The limits of the contract (`RegisterRequest`, `PasswordResetConfirmRequest`); the API checks them again and also the list of common passwords. */
export const MIN_PASSWORD_LENGTH = 10
export const MAX_PASSWORD_LENGTH = 128
export const MAX_NAME_LENGTH = 80
export const MAX_EMAIL_LENGTH = 254

const email = z
  .string()
  .trim()
  .min(1, "Введите адрес почты.")
  .max(MAX_EMAIL_LENGTH, "Адрес слишком длинный.")
  .email("Проверьте адрес почты.")

const newPassword = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Не короче ${MIN_PASSWORD_LENGTH} символов.`)
  .max(MAX_PASSWORD_LENGTH, `Не длиннее ${MAX_PASSWORD_LENGTH} символов.`)

const accepted = (message: string) => z.boolean().refine((value) => value, { message })

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Введите пароль.").max(MAX_PASSWORD_LENGTH, `Не длиннее ${MAX_PASSWORD_LENGTH} символов.`),
})

export const registerSchema = z.object({
  email,
  name: z.string().trim().min(1, "Введите имя.").max(MAX_NAME_LENGTH, `Не длиннее ${MAX_NAME_LENGTH} символов.`),
  password: newPassword,
  consent: accepted("Нужно согласие на обработку персональных данных."),
  adult: accepted("Нужно подтвердить, что вам исполнилось 18 лет."),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({ password: newPassword, repeat: z.string() })
  .refine((values) => values.password === values.repeat, { path: ["repeat"], message: "Пароли не совпадают." })

export type LoginValues = z.input<typeof loginSchema>
export type RegisterValues = z.input<typeof registerSchema>
export type ForgotPasswordValues = z.input<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.input<typeof resetPasswordSchema>
