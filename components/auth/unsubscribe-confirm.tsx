"use client"

import { useState } from "react"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api/client"
import type { components } from "@/lib/api/schema"
import { errorTextOf } from "@/lib/api/errors"
import { unwrap } from "@/lib/api/hooks"

type Category = components["schemas"]["EmailCategory"]

/** How each category of letters is called in a sentence. */
export const CATEGORY_LABELS: Record<Category, string> = {
  NEW_MESSAGE: "письма о новых сообщениях",
}

type Phase = { kind: "idle" } | { kind: "working" } | { kind: "done"; category: Category } | { kind: "failed"; message: string }

/**
 * The page of the link in a letter. Opening it changes nothing: a mail scanner may open every link of a letter, so the person has
 * to press the button, and only then the form of the one-click unsubscribe (RFC 8058) is sent (AC-24).
 */
export function UnsubscribeConfirm({ token }: { token?: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" })

  if (token === undefined) return <FormAlert message="Ссылка для отписки недействительна." />

  const unsubscribe = async () => {
    setPhase({ kind: "working" })
    try {
      const result = await unwrap(
        api.POST("/v1/notifications/unsubscribe", {
          params: { query: { token } },
          body: { "List-Unsubscribe": "One-Click" },
          bodySerializer: (body: Record<string, string>) => new URLSearchParams(body).toString(),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }),
      )
      setPhase({ kind: "done", category: result.category })
    } catch (error) {
      setPhase({ kind: "failed", message: errorTextOf(error) })
    }
  }

  if (phase.kind === "done") {
    return <FormAlert tone="info" message={`Готово: мы больше не будем присылать ${CATEGORY_LABELS[phase.category]}.`} />
  }

  return (
    <div className="flex flex-col gap-4">
      {phase.kind === "failed" ? <FormAlert message={phase.message} /> : null}
      <p className="text-sm text-muted-foreground">
        Нажмите кнопку, чтобы перестать получать {CATEGORY_LABELS.NEW_MESSAGE}. Письма о безопасности аккаунта (подтверждение почты, новый
        пароль) отключить нельзя, они будут приходить по-прежнему.
      </p>
      <Button onClick={unsubscribe} disabled={phase.kind === "working"}>
        {phase.kind === "working" ? "Отписываем…" : "Отписаться"}
      </Button>
    </div>
  )
}
