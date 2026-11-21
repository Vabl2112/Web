"use client"

import { type ReactNode, useId, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf, fieldErrorsOf, messageOf } from "@/lib/api/errors"
import { unwrap } from "@/lib/api/hooks"
import { type RegisterValues, MIN_PASSWORD_LENGTH, registerSchema } from "@/lib/auth/schemas"
import { useSession } from "@/lib/auth/session"
import { CONSENT_VERSION } from "@/lib/consent"
import { cn } from "@/lib/utils"

interface CheckFieldProps {
  checked: boolean
  onChange(checked: boolean): void
  error?: string
  children: ReactNode
}

function CheckField({ checked, onChange, error, children }: CheckFieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-3">
        <Checkbox id={id} checked={checked} onCheckedChange={(value) => onChange(value === true)} aria-invalid={error ? true : undefined} />
        <Label htmlFor={id} className="block text-sm leading-snug font-normal">
          {children}
        </Label>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The rule of the password under the field, ticked green as soon as it holds (the first prototype listed four rules; the API has only
 * the length and the list of common passwords, which it checks on sending).
 */
function PasswordLength({ password }: { password: string }) {
  const met = password.length >= MIN_PASSWORD_LENGTH
  return (
    <span className={cn("flex items-center gap-2 text-xs transition-colors", met ? "text-green-600" : "text-muted-foreground")}>
      <span
        aria-hidden
        className={cn(
          "flex size-4 items-center justify-center rounded-full border transition-colors",
          met ? "border-green-600 bg-green-600 text-white" : "border-muted-foreground",
        )}
      >
        {met ? <Check className="size-3" /> : null}
      </span>
      Не короче {MIN_PASSWORD_LENGTH} символов
    </span>
  )
}

const FORM_FIELDS = ["email", "name", "password"] as const

/**
 * Register, then sign in with the same data (the API does not sign the person in) and go to the page that asks to confirm the
 * e-mail. If the sign-in fails the account still exists, so the person is told to sign in by hand.
 */
export function RegisterForm() {
  const router = useRouter()
  const { signedIn } = useSession()
  const [failure, setFailure] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", name: "", password: "", consent: false, adult: false },
  })
  const [showPassword, setShowPassword] = useState(false)
  const password = useWatch({ control, name: "password" })

  const submit = handleSubmit(async ({ email, name, password }) => {
    setFailure(null)
    try {
      await unwrap(api.POST("/v1/auth/register", { body: { email, name, password, consentVersion: CONSENT_VERSION, adultConfirmed: true } }))
    } catch (error) {
      showRegistrationError(error)
      return
    }
    try {
      await signedIn(await unwrap(api.POST("/v1/auth/login", { body: { email, password } })))
      router.replace("/verify-email")
    } catch {
      setCreated(true)
    }
  })

  function showRegistrationError(error: unknown) {
    if (!(error instanceof ApiError)) return setFailure(errorTextOf(error))
    if (error.code === "EMAIL_TAKEN") return setError("email", { message: messageOf(error) })
    const byField = fieldErrorsOf(error)
    const known = FORM_FIELDS.filter((field) => byField[field] !== undefined)
    if (known.length === 0 && byField.adultConfirmed === undefined) return setFailure(messageOf(error))
    known.forEach((field) => setError(field, { message: byField[field] }))
    if (byField.adultConfirmed !== undefined) setError("adult", { message: byField.adultConfirmed })
  }

  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert tone="info" message="Аккаунт создан, мы отправили письмо со ссылкой для подтверждения почты. Войдите, чтобы продолжить." />
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {failure ? <FormAlert message={failure} /> : null}
      <TextField
        label="Имя"
        icon={User}
        placeholder="Ваше имя"
        autoComplete="name"
        className="h-12"
        hint="Его увидит собеседник в сообщениях."
        error={errors.name?.message}
        {...register("name")}
      />
      <TextField
        label="Почта"
        icon={Mail}
        type="email"
        placeholder="name@example.com"
        autoComplete="email"
        className="h-12"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Пароль"
        icon={Lock}
        type={showPassword ? "text" : "password"}
        placeholder="Придумайте пароль"
        autoComplete="new-password"
        className="h-12"
        end={
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Скрыть символы" : "Показать символы"}
            aria-pressed={showPassword}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
          </button>
        }
        hint={<PasswordLength password={password} />}
        error={errors.password?.message}
        {...register("password")}
      />
      <Controller
        control={control}
        name="consent"
        render={({ field }) => (
          <CheckField checked={field.value} onChange={field.onChange} error={errors.consent?.message}>
            Я принимаю{" "}
            <Link href="/terms" target="_blank" className="underline underline-offset-4">
              условия использования
            </Link>{" "}
            и{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-4">
              политику обработки персональных данных
            </Link>{" "}
            (версия {CONSENT_VERSION}).
          </CheckField>
        )}
      />
      <Controller
        control={control}
        name="adult"
        render={({ field }) => (
          <CheckField checked={field.value} onChange={field.onChange} error={errors.adult?.message}>
            Мне исполнилось 18 лет.
          </CheckField>
        )}
      />
      <Button type="submit" disabled={isSubmitting} className="h-12 w-full gap-2 text-base">
        {isSubmitting ? (
          <>
            <Loader2 aria-hidden className="size-5 animate-spin" />
            Создаём аккаунт…
          </>
        ) : (
          <>
            Создать аккаунт
            <ArrowRight aria-hidden className="size-5" />
          </>
        )}
      </Button>
    </form>
  )
}
