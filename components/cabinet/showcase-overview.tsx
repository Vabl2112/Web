"use client"

import { useState } from "react"
import Link from "next/link"
import { FormAlert } from "@/components/auth/form-alert"
import { ShowcaseStatusBadge, ReviewBadge } from "@/components/cabinet/badges"
import { CreatorGate } from "@/components/cabinet/creator-gate"
import { EggImage } from "@/components/egg-image"
import { Button } from "@/components/ui/button"
import { unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf, messageOf } from "@/lib/api/errors"
import { MISSING_REQUIREMENTS, type MyCreatorProfile, SUSPENSION_LABELS, canSubmit } from "@/lib/cabinet"
import { refreshCabinet, useChecklist, useMyProfile } from "@/lib/cabinet-hooks"

function Checklist() {
  const { data } = useChecklist()
  if (data === undefined) return null
  if (data.ready) return <FormAlert tone="info" message="Всё готово: витрину можно отправить на проверку." />
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-medium">Чтобы отправить витрину на проверку:</h3>
      <ul className="flex flex-col gap-1 text-sm">
        {data.missing.map((item) => (
          <li key={item}>
            <Link href={MISSING_REQUIREMENTS[item].href} className="underline underline-offset-4">
              {MISSING_REQUIREMENTS[item].text}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SubmitBlock({ profile }: { profile: MyCreatorProfile }) {
  const { change } = useMyProfile()
  const { data } = useChecklist()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setFailure(null)
    try {
      const updated = await unwrap(api.POST("/v1/me/creator-profile/submit"))
      await change(updated, { revalidate: false })
      await refreshCabinet()
    } catch (error) {
      const missing = error instanceof ApiError ? (error.problem?.missing ?? []) : []
      setFailure(
        missing.length > 0 ? `${messageOf(error as ApiError)} ${missing.map((item) => MISSING_REQUIREMENTS[item].text).join("; ")}.` : errorTextOf(error),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <Checklist />
      {failure ? <FormAlert message={failure} /> : null}
      <Button className="w-fit" onClick={submit} disabled={busy || data?.ready !== true || !canSubmit(profile.status)}>
        {busy ? "Отправляем…" : "Отправить на проверку"}
      </Button>
    </div>
  )
}

function Overview({ profile }: { profile: MyCreatorProfile }) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-semibold">{profile.displayName ?? "Витрина без названия"}</h2>
        <ShowcaseStatusBadge status={profile.status} />
        {profile.status === "PUBLISHED" ? (
          <Link href={`/creators/${profile.id}`} className="text-sm underline underline-offset-4">
            Открыть витрину
          </Link>
        ) : null}
      </div>
      {profile.suspensionReasons.map((reason) => (
        <FormAlert key={reason} message={SUSPENSION_LABELS[reason]} />
      ))}
      {profile.status === "REJECTED" ? (
        <FormAlert message={`Витрина отклонена${profile.rejectionReason ? `: ${profile.rejectionReason}` : "."} Исправьте и отправьте её на проверку снова.`} />
      ) : null}
      {profile.status === "PENDING_REVIEW" ? (
        <FormAlert tone="info" message="Витрина на проверке, обычно это занимает до двух суток. Пока вы можете продолжать её наполнять." />
      ) : null}
      {profile.status === "PUBLISHED" && profile.changedSinceReview ? (
        <FormAlert tone="info" message="Вы изменили текст опубликованной витрины: правки уже видны посетителям, а команда проверит их позже." />
      ) : null}
      {profile.pendingAvatar ? (
        <div className="flex items-center gap-4">
          <EggImage image={profile.pendingAvatar.image} alt="" sizes="64px" className="size-16 rounded-full object-cover" />
          <div className="flex flex-col gap-1 text-sm">
            <span>Новый аватар</span>
            <ReviewBadge status={profile.pendingAvatar.reviewStatus} />
            {profile.pendingAvatar.rejectionReason ? <span className="text-destructive">{profile.pendingAvatar.rejectionReason}</span> : null}
          </div>
        </div>
      ) : null}
      {canSubmit(profile.status) ? <SubmitBlock profile={profile} /> : null}
    </section>
  )
}

/** The first page of the cabinet: the state of the showcase, why it was refused, what is missing, and the button to send it to review. */
export function ShowcaseOverview() {
  return <CreatorGate>{(profile) => <Overview profile={profile} />}</CreatorGate>
}
