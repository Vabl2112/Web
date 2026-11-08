"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { unwrap } from "@/lib/api/hooks"
import { type LoginValues, loginSchema } from "@/lib/auth/schemas"
import { useSession } from "@/lib/auth/session"

/** Sign in. `returnTo` is a path of this site (the page made it safe), the person goes there afterwards. */
export function LoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter()
  const { signedIn } = useSession()
  const [failure, setFailure] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } })

  const submit = handleSubmit(async (values) => {
    setFailure(null)
    try {
      const account = await unwrap(api.POST("/v1/auth/login", { body: values }))
      await signedIn(account)
      router.replace(returnTo)
    } catch (error) {
      setFailure(errorTextOf(error))
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {failure ? <FormAlert message={failure} /> : null}
      <TextField label="Почта" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <TextField label="Пароль" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Входим…" : "Войти"}
      </Button>
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <Link href="/forgot-password" className="underline underline-offset-4">
          Забыли пароль?
        </Link>
        <span>
          Нет аккаунта?{" "}
          <Link href="/register" className="underline underline-offset-4">
            Зарегистрироваться
          </Link>
        </span>
      </div>
    </form>
  )
}
