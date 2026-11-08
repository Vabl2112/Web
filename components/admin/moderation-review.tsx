"use client"

import { useState } from "react"
import Link from "next/link"
import { NoAccess } from "@/components/admin/no-access"
import { ReasonDialog } from "@/components/admin/reason-dialog"
import { FormAlert } from "@/components/auth/form-alert"
import { ReviewBadge, ShowcaseStatusBadge } from "@/components/cabinet/badges"
import { CreatorProfileHeader } from "@/components/catalog/creator-profile-header"
import { EggImage } from "@/components/egg-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { expectOk, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useGet } from "@/lib/api/hooks"
import { creatorKey, refreshAdmin } from "@/lib/admin-hooks"
import { type ReviewStatus, SUSPENSION_LABELS } from "@/lib/cabinet"
import { LISTING_TYPE_LABELS } from "@/lib/catalog"
import { formatPriceFrom } from "@/lib/format"
import { type AdminCreatorView, type ContentRef, canDecide, pendingRefsOf, previewOf } from "@/lib/moderation"

type Dialog = { kind: "reject" } | { kind: "suspend" } | { kind: "suspend-user" } | { kind: "reject-content"; ref: ContentRef }

const ACCOUNT_STATUS_LABELS = { ACTIVE: "Активен", SUSPENDED: "Приостановлен", DELETED: "Удалён" } as const

interface DecisionProps {
  status: ReviewStatus
  busy: boolean
  onApprove(): void
  onReject(): void
}

/** The two buttons of one piece of content; only content that waits can be decided. */
function Decision({ status, busy, onApprove, onReject }: DecisionProps) {
  if (status !== "PENDING") return null
  return (
    <div className="flex gap-1">
      <Button size="sm" disabled={busy} onClick={onApprove}>
        Одобрить
      </Button>
      <Button size="sm" variant="outline" disabled={busy} onClick={onReject}>
        Отклонить
      </Button>
    </div>
  )
}

interface ControlsProps {
  busy: boolean
  approveContent(ref: ContentRef): void
  rejectContent(ref: ContentRef): void
}

function ReviewBody({ view, controls }: { view: AdminCreatorView; controls: ControlsProps }) {
  const { profile, listings, portfolioItems } = view
  const { busy, approveContent, rejectContent } = controls
  return (
    <>
      <CreatorProfileHeader creator={previewOf(profile)} />
      {profile.avatar || profile.pendingAvatar ? (
        <section className="flex flex-wrap gap-6">
          {profile.avatar ? (
            <figure className="flex flex-col items-center gap-2 text-sm">
              <EggImage image={profile.avatar.image} alt="" sizes="96px" className="size-24 rounded-full object-cover" />
              <figcaption className="flex flex-col items-center gap-2">
                <span>{profile.avatar.reviewStatus === "APPROVED" ? "Опубликованный аватар" : "Аватар"}</span>
                <ReviewBadge status={profile.avatar.reviewStatus} />
                {profile.pendingAvatar === undefined ? (
                  <Decision
                    status={profile.avatar.reviewStatus}
                    busy={busy}
                    onApprove={() => approveContent({ kind: "AVATAR" })}
                    onReject={() => rejectContent({ kind: "AVATAR" })}
                  />
                ) : null}
              </figcaption>
            </figure>
          ) : null}
          {profile.pendingAvatar ? (
            <figure className="flex flex-col items-center gap-2 text-sm">
              <EggImage image={profile.pendingAvatar.image} alt="" sizes="96px" className="size-24 rounded-full object-cover" />
              <figcaption className="flex flex-col items-center gap-2">
                <span>Новый аватар</span>
                <ReviewBadge status={profile.pendingAvatar.reviewStatus} />
                <Decision
                  status={profile.pendingAvatar.reviewStatus}
                  busy={busy}
                  onApprove={() => approveContent({ kind: "AVATAR" })}
                  onReject={() => rejectContent({ kind: "AVATAR" })}
                />
              </figcaption>
            </figure>
          ) : null}
        </section>
      ) : null}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Работы: {portfolioItems.length}</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {portfolioItems.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 rounded-xl border border-border p-3">
              <EggImage image={item.image} alt={item.title ?? ""} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-square w-full rounded-lg object-cover" />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <ReviewBadge status={item.reviewStatus} />
                <span className="truncate">{item.title ?? item.category.name}</span>
              </div>
              <Decision
                status={item.reviewStatus}
                busy={busy}
                onApprove={() => approveContent({ kind: "PORTFOLIO_ITEM", id: item.id })}
                onReject={() => rejectContent({ kind: "PORTFOLIO_ITEM", id: item.id })}
              />
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Позиции: {listings.length}</h2>
        <ul className="flex flex-col gap-3">
          {listings.map((listing) => (
            <li key={listing.id} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{listing.title}</h3>
                <Badge variant="outline">{LISTING_TYPE_LABELS[listing.type]}</Badge>
                <ReviewBadge status={listing.reviewStatus} />
                <span className="ml-auto font-medium">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</span>
              </div>
              {listing.description ? <p className="text-sm leading-relaxed whitespace-pre-line">{listing.description}</p> : null}
              <Decision
                status={listing.reviewStatus}
                busy={busy}
                onApprove={() => approveContent({ kind: "LISTING", id: listing.id })}
                onReject={() => rejectContent({ kind: "LISTING", id: listing.id })}
              />
              {listing.photos.length > 0 ? (
                <ul className="flex flex-wrap gap-3">
                  {listing.photos.map((photo) => (
                    <li key={photo.id} className="flex w-32 flex-col gap-1">
                      <EggImage image={photo.image} alt="" sizes="128px" className="aspect-square w-full rounded-lg object-cover" />
                      <ReviewBadge status={photo.reviewStatus} />
                      <Decision
                        status={photo.reviewStatus}
                        busy={busy}
                        onApprove={() => approveContent({ kind: "LISTING_PHOTO", id: photo.id })}
                        onReject={() => rejectContent({ kind: "LISTING_PHOTO", id: photo.id })}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

function Review({ view }: { view: AdminCreatorView }) {
  const { profile, owner } = view
  const id = profile.id
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const pending = pendingRefsOf(view)
  const path = { params: { path: { id } } }
  const adminSuspended = profile.suspensionReasons.includes("ADMIN")

  /** Runs a decision that needs no reason; the page and the queues are read again after it. */
  const act = async (decision: () => Promise<unknown>) => {
    setBusy(true)
    setFailure(null)
    try {
      await decision()
      await refreshAdmin()
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  const confirm = async (reason: string) => {
    if (dialog === null) return
    switch (dialog.kind) {
      case "reject":
        await unwrap(api.POST("/v1/admin/creators/{id}/reject", { ...path, body: { reason } }))
        break
      case "suspend":
        await unwrap(api.POST("/v1/admin/creators/{id}/suspend", { ...path, body: { reason } }))
        break
      case "suspend-user":
        await unwrap(api.POST("/v1/admin/users/{id}/suspend", { params: { path: { id: owner.id } }, body: { reason } }))
        break
      case "reject-content":
        await expectOk(api.POST("/v1/admin/creators/{id}/content/reject", { ...path, body: { items: [dialog.ref], reason } }))
        break
    }
    await refreshAdmin()
  }

  const dialogText = {
    reject: { title: "Отклонить витрину", description: "Причину увидит создатель. После правок он сможет отправить витрину снова.", label: "Отклонить" },
    suspend: { title: "Приостановить витрину", description: "Витрина исчезнет из каталога. Причина сохранится в журнале.", label: "Приостановить" },
    "suspend-user": { title: "Приостановить аккаунт", description: "Владелец не сможет войти, витрина будет скрыта. Причина сохранится в журнале.", label: "Приостановить" },
    "reject-content": { title: "Отклонить материал", description: "Причину увидит создатель.", label: "Отклонить" },
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center gap-3">
          <ShowcaseStatusBadge status={profile.status} />
          {profile.changedSinceReview ? <Badge variant="outline">Текст изменён после проверки</Badge> : null}
          {profile.status === "PUBLISHED" ? (
            <Link href={`/creators/${id}`} className="text-sm underline underline-offset-4">
              Открыть публичную страницу
            </Link>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Владелец: {owner.name}, {owner.email} ({ACCOUNT_STATUS_LABELS[owner.status]})
        </p>
        {profile.suspensionReasons.map((reason) => (
          <FormAlert key={reason} tone="info" message={SUSPENSION_LABELS[reason]} />
        ))}
        {profile.rejectionReason ? <FormAlert tone="info" message={`Причина отказа: ${profile.rejectionReason}`} /> : null}
        {failure ? <FormAlert message={failure} /> : null}
        <div className="flex flex-wrap gap-2">
          {canDecide(profile.status) ? (
            <>
              <Button disabled={busy} onClick={() => void act(() => unwrap(api.POST("/v1/admin/creators/{id}/approve", path)))}>
                Одобрить витрину
              </Button>
              <Button variant="outline" disabled={busy} onClick={() => setDialog({ kind: "reject" })}>
                Отклонить…
              </Button>
            </>
          ) : null}
          {pending.length > 0 ? (
            <Button variant="outline" disabled={busy} onClick={() => void act(() => expectOk(api.POST("/v1/admin/creators/{id}/content/approve", path)))}>
              Одобрить всё ожидающее ({pending.length})
            </Button>
          ) : null}
          {adminSuspended ? (
            <Button variant="outline" disabled={busy} onClick={() => void act(() => unwrap(api.POST("/v1/admin/creators/{id}/unsuspend", path)))}>
              Снять приостановку витрины
            </Button>
          ) : (
            <Button variant="ghost" disabled={busy} onClick={() => setDialog({ kind: "suspend" })}>
              Приостановить витрину…
            </Button>
          )}
          {owner.status === "SUSPENDED" ? (
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => void act(() => unwrap(api.POST("/v1/admin/users/{id}/unsuspend", { params: { path: { id: owner.id } } })))}
            >
              Снять приостановку аккаунта
            </Button>
          ) : (
            <Button variant="ghost" disabled={busy || owner.status === "DELETED"} onClick={() => setDialog({ kind: "suspend-user" })}>
              Приостановить аккаунт…
            </Button>
          )}
        </div>
      </section>
      <ReviewBody
        view={view}
        controls={{
          busy,
          approveContent: (ref) => void act(() => expectOk(api.POST("/v1/admin/creators/{id}/content/approve", { ...path, body: { items: [ref] } }))),
          rejectContent: (ref) => setDialog({ kind: "reject-content", ref }),
        }}
      />
      <ReasonDialog
        open={dialog !== null}
        title={dialog ? dialogText[dialog.kind].title : ""}
        description={dialog ? dialogText[dialog.kind].description : ""}
        confirmLabel={dialog ? dialogText[dialog.kind].label : ""}
        onConfirm={confirm}
        onClose={() => setDialog(null)}
      />
    </div>
  )
}

/** The card of one showcase for the moderator: the preview as a visitor would see it, with what still waits for approval next to it. */
export function ModerationReview({ creatorId }: { creatorId: string }) {
  const { data, error, isLoading } = useGet(creatorKey(creatorId), () => api.GET("/v1/admin/creators/{id}", { params: { path: { id: creatorId } } }), {
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })
  if (error?.status === 403) return <NoAccess />
  if (error?.status === 404) return <FormAlert message="Витрина не найдена." />
  if (error) return <FormAlert message={errorTextOf(error)} />
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Загружаем…</p>
  return <Review view={data} />
}
