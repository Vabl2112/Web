"use client"

import { useState } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf, fieldErrorsOf } from "@/lib/api/errors"
import { expectOk } from "@/lib/api/hooks"
import { type ResetPasswordValues, MIN_PASSWORD_LENGTH, resetPasswordSchema } from "@/lib/auth/schemas"

function NewLinkNotice({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <FormAlert message={message} />
      <Button asChild variant="outline">
        <Link href="/forgot-password">Запросить новую ссылку</Link>
      </Button>
    </div>
  )
}

/** Set the new password with the token from the letter. A used, expired or unknown token (`410`) sends the person to ask again. */
export function ResetPasswordForm({ token }: { token?: string }) {
  const [done, setDone] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [tokenRefused, setTokenRefused] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", repeat: "" } })

  const submit = handleSubmit(async ({ password }) => {
    if (token === undefined) return
    setFailure(null)
    try {
      await expectOk(api.POST("/v1/auth/password-reset/confirm", { body: { token, newPassword: password } }))
      setDone(true)
    } catch (error) {
      if (error instanceof ApiError && error.status === 410) return setTokenRefused(true)
      const passwordError = error instanceof ApiError ? fieldErrorsOf(error).newPassword : undefined
      if (passwordError !== undefined) return setError("password", { message: passwordError })
      setFailure(errorTextOf(error))
    }
  })

  if (token === undefined || tokenRefused) return <NewLinkNotice message="Ссылка недействительна или устарела." />

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert tone="info" message="Пароль изменён. Все прежние входы завершены, войдите с новым паролем." />
        <Button asChild>
          <Link href="/login">Войти</Link>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {failure ? <FormAlert message={failure} /> : null}
      <TextField
        label="Новый пароль"
        type="password"
        autoComplete="new-password"
        hint={`Не короче ${MIN_PASSWORD_LENGTH} символов.`}
        error={errors.password?.message}
        {...register("password")}
      />
      <TextField label="Повторите пароль" type="password" autoComplete="new-password" error={errors.repeat?.message} {...register("repeat")} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем…" : "Сохранить пароль"}
      </Button>
    </form>
  )
}
