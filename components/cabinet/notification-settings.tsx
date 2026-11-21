"use client"

import { useId, useState } from "react"
import { FormAlert } from "@/components/auth/form-alert"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useNotificationSettings } from "@/lib/cabinet-hooks"
import { useFeatures } from "@/lib/features"

/**
 * The e-mails the person may switch off (`getNotificationSettings`, `updateNotificationSettings`): today one, the letter about a new
 * unread message. The letters of the account (the confirmation, the reset of a password) are not listed, the API sends them always.
 * Nothing is shown while messaging is off in the backend: there is no such letter then.
 */
export function NotificationSettings() {
  const { messaging } = useFeatures()
  const { settings, error, isLoading, change } = useNotificationSettings(messaging)
  const switchId = useId()
  const headingId = useId()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  if (!messaging) return null

  const save = async (newMessage: boolean) => {
    setBusy(true)
    setFailure(null)
    try {
      const stored = await unwrap(api.PUT("/v1/me/notification-settings", { body: { newMessage } }))
      await change(stored, { revalidate: false })
    } catch (problem) {
      setFailure(errorTextOf(problem))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-lg font-semibold">
        Письма
      </h2>
      {error ? <FormAlert message={errorTextOf(error)} /> : null}
      {failure ? <FormAlert message={failure} /> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Загружаем…</p> : null}
      {settings ? (
        <div className="flex items-start gap-3">
          <Switch id={switchId} className="mt-0.5" checked={settings.newMessage} disabled={busy} onCheckedChange={(next) => void save(next)} />
          <div className="flex flex-col gap-1">
            <Label htmlFor={switchId}>Письмо о новом сообщении</Label>
            <p className="text-sm text-muted-foreground">
              Придёт, если сообщение осталось непрочитанным: не чаще одного на диалог за 15 минут и без текста сообщения.
            </p>
          </div>
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">Письма о подтверждении почты и сбросе пароля отключить нельзя.</p>
    </section>
  )
}
