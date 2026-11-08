"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { expectOk } from "@/lib/api/hooks"
import { type ForgotPasswordValues, forgotPasswordSchema } from "@/lib/auth/schemas"

/**
 * Ask for the letter with the link to a new password. The API answers the same for an address that is registered and for one that
 * is not, so the page says the same too: it must not tell who has an account (AC-09).
 */
export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } })

  const submit = handleSubmit(async (values) => {
    setFailure(null)
    try {
      await expectOk(api.POST("/v1/auth/password-reset/request", { body: values }))
      setSent(true)
    } catch (error) {
      setFailure(errorTextOf(error))
    }
  })

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert tone="info" message="Если этот адрес зарегистрирован, мы отправили на него письмо со ссылкой для нового пароля. Ссылка действует один час." />
        <Button asChild variant="outline">
          <Link href="/login">Вернуться ко входу</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {failure ? <FormAlert message={failure} /> : null}
      <TextField label="Почта" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Отправляем…" : "Отправить ссылку"}
      </Button>
      <Link href="/login" className="text-sm text-muted-foreground underline underline-offset-4">
        Вернуться ко входу
      </Link>
    </form>
  )
}
