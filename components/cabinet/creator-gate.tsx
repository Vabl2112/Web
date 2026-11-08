"use client"

import { type ReactNode, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormAlert } from "@/components/auth/form-alert"
import { Button } from "@/components/ui/button"
import { unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useSession } from "@/lib/auth/session"
import type { MyCreatorProfile } from "@/lib/cabinet"
import { refreshCabinet, useMyProfile } from "@/lib/cabinet-hooks"

/** For a person who has no showcase yet: one button creates an empty draft (it needs a confirmed e-mail) and leads to the profile. */
export function BecomeCreator() {
  const router = useRouter()
  const { account } = useSession()
  const { change } = useMyProfile()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const unconfirmed = account !== null && !account.emailVerified

  const create = async () => {
    setBusy(true)
    setFailure(null)
    try {
      const created = await unwrap(api.POST("/v1/me/creator-profile", { body: {} }))
      await change(created, { revalidate: false })
      await refreshCabinet()
      router.push("/cabinet/profile")
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex max-w-xl flex-col gap-4 rounded-xl border border-border p-6">
      <h2 className="text-xl font-semibold">Станьте создателем</h2>
      <p className="text-muted-foreground">
        Создайте витрину: расскажите о себе, добавьте работы и позиции. После проверки её увидят все, а покупатели смогут вам написать.
      </p>
      {unconfirmed ? (
        <FormAlert
          tone="info"
          message="Чтобы создать витрину, сначала подтвердите адрес почты: ссылка в письме, которое мы отправили при регистрации."
        />
      ) : null}
      {failure ? <FormAlert message={failure} /> : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={create} disabled={busy || unconfirmed}>
          {busy ? "Создаём…" : "Стать создателем"}
        </Button>
        {unconfirmed ? (
          <Button asChild variant="outline">
            <Link href="/verify-email">Подтвердить почту</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}

/** The pages of the cabinet show their content for a person with a showcase and the invitation to create one for everybody else. */
export function CreatorGate({ children }: { children: (profile: MyCreatorProfile) => ReactNode }) {
  const { profile, isLoading, notCreator, error } = useMyProfile()
  if (isLoading) return <p className="text-sm text-muted-foreground">Загружаем…</p>
  if (notCreator) return <BecomeCreator />
  if (!profile) return <FormAlert message={errorTextOf(error)} />
  return <>{children(profile)}</>
}
