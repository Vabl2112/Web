"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { expectOk } from "@/lib/api/hooks"
import { useSession } from "@/lib/auth/session"

type Phase = { kind: "idle" } | { kind: "working" } | { kind: "done" } | { kind: "failed"; message: string }
type Resend = { kind: "idle" } | { kind: "working" } | { kind: "sent" } | { kind: "failed"; message: string }

/**
 * The page of the link in the confirmation letter. With a token it confirms the address at once (the token is spent once, so the
 * call is made once even when React starts the effect twice). Without a token it is the page after registration: "look in your
 * mail", with a button for another letter.
 */
export function VerifyEmail({ token }: { token?: string }) {
  const { account, isGuest, refresh } = useSession()
  const [phase, setPhase] = useState<Phase>(token ? { kind: "working" } : { kind: "idle" })
  const [resend, setResend] = useState<Resend>({ kind: "idle" })
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    const verify = async () => {
      try {
        await expectOk(api.POST("/v1/auth/verify-email", { body: { token } }))
      } catch (error) {
        setPhase({ kind: "failed", message: errorTextOf(error) })
        return
      }
      setPhase({ kind: "done" })
      refresh().catch(() => undefined)
    }
    void verify()
  }, [token, refresh])

  const sendAgain = async () => {
    setResend({ kind: "working" })
    try {
      await expectOk(api.POST("/v1/auth/resend-verification"))
      setResend({ kind: "sent" })
    } catch (error) {
      setResend({ kind: "failed", message: errorTextOf(error) })
    }
  }

  if (phase.kind === "working") return <p className="text-sm text-muted-foreground">Подтверждаем адрес…</p>

  if (phase.kind === "done" || (token === undefined && account?.emailVerified)) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert tone="info" message="Адрес почты подтверждён." />
        <Button asChild>
          <Link href={isGuest ? "/login" : "/cabinet"}>{isGuest ? "Войти" : "Перейти в кабинет"}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {phase.kind === "failed" ? (
        <FormAlert message={phase.message} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Мы отправили письмо со ссылкой для подтверждения адреса. Ссылка действует 24 часа. Если письма нет, загляните в «Спам».
        </p>
      )}
      {resend.kind === "sent" ? <FormAlert tone="info" message="Новое письмо отправлено." /> : null}
      {resend.kind === "failed" ? <FormAlert message={resend.message} /> : null}
      {account ? (
        <Button variant="outline" onClick={sendAgain} disabled={resend.kind === "working"}>
          {resend.kind === "working" ? "Отправляем…" : "Отправить письмо ещё раз"}
        </Button>
      ) : (
        <Button asChild variant="outline">
          <Link href="/login?returnTo=%2Fverify-email">Войти, чтобы отправить письмо ещё раз</Link>
        </Button>
      )}
    </div>
  )
}
