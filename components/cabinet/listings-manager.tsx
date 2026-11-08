"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { ReviewBadge } from "@/components/cabinet/badges"
import { CreatorGate } from "@/components/cabinet/creator-gate"
import { CityField } from "@/components/cabinet/city-field"
import { CheckboxField, SelectField, TextAreaField } from "@/components/cabinet/fields"
import { UploadButton } from "@/components/cabinet/upload-button"
import { EggImage } from "@/components/egg-image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { expectOk, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf } from "@/lib/api/errors"
import type { MyListing } from "@/lib/cabinet"
import { EMPTY_LISTING, type ListingValues, listingRequest, listingSchema, listingValuesOf } from "@/lib/cabinet-schemas"
import { refreshCabinet, useCategories, useMyListings } from "@/lib/cabinet-hooks"
import { type City, LISTING_TYPES, LISTING_TYPE_LABELS } from "@/lib/catalog"
import { formatPriceFrom } from "@/lib/format"
import { applyFieldErrors } from "@/lib/form-errors"
import { imageFileProblem, uploadImage } from "@/lib/media"

const FIELD_NAMES = {
  title: "title",
  description: "description",
  categoryId: "categoryId",
  priceFromMinor: "price",
  durationText: "durationText",
  leadTimeDays: "leadTimeDays",
} as const

/** The form of one listing, to create or to change. The type is chosen once: the API does not let it change afterwards. */
function ListingForm({ listing, onSaved }: { listing: MyListing | null; onSaved(): void }) {
  const categories = useCategories()
  const [failure, setFailure] = useState<string | null>(null)
  const [city, setCity] = useState<City | null>(listing?.city ?? null)
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ListingValues>({ resolver: zodResolver(listingSchema), defaultValues: listing ? listingValuesOf(listing) : EMPTY_LISTING })
  const type = useWatch({ control, name: "type" })

  const save = handleSubmit(async (values) => {
    setFailure(null)
    try {
      if (listing) {
        await unwrap(api.PUT("/v1/me/listings/{id}", { params: { path: { id: listing.id } }, body: listingRequest(values, listing.attributes, city?.id) }))
      } else {
        await unwrap(api.POST("/v1/me/listings", { body: { ...listingRequest(values, undefined, city?.id), type: values.type } }))
      }
      await refreshCabinet()
      onSaved()
    } catch (error) {
      const shown = error instanceof ApiError && applyFieldErrors(error, setError, FIELD_NAMES)
      setFailure(shown ? null : errorTextOf(error))
    }
  })

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      {failure ? <FormAlert message={failure} /> : null}
      <SelectField
        label="Тип"
        disabled={listing !== null}
        hint={listing ? "Тип нельзя изменить после создания." : undefined}
        options={LISTING_TYPES.map((value) => ({ value, label: LISTING_TYPE_LABELS[value] }))}
        {...register("type")}
      />
      <TextField label="Название" error={errors.title?.message} {...register("title")} />
      <SelectField
        label="Категория"
        placeholder="Выберите категорию"
        options={categories.map((category) => ({ value: category.id, label: category.name }))}
        error={errors.categoryId?.message}
        {...register("categoryId")}
      />
      <TextAreaField label="Описание" rows={5} error={errors.description?.message} {...register("description")} />
      <TextField label="Цена от, ₽" inputMode="decimal" hint="Пусто — «по договорённости»." error={errors.price?.message} {...register("price")} />
      {type === "SERVICE" ? <TextField label="Длительность" hint="Например, «2 часа»." error={errors.durationText?.message} {...register("durationText")} /> : null}
      {type === "READY_PRODUCT" ? <CheckboxField label="В наличии" {...register("inStock")} /> : null}
      {type === "MADE_TO_ORDER" ? (
        <TextField label="Срок изготовления, дней" inputMode="numeric" error={errors.leadTimeDays?.message} {...register("leadTimeDays")} />
      ) : null}
      <CityField value={city} onChange={setCity} />
      <CheckboxField label="Возможна доставка" {...register("deliveryAvailable")} />
      <CheckboxField label="Скрыть из каталога" {...register("hidden")} />
      <Button type="submit" className="w-fit" disabled={isSubmitting}>
        {isSubmitting ? "Сохраняем…" : "Сохранить"}
      </Button>
    </form>
  )
}

function ListingRow({ listing, onEdit }: { listing: MyListing; onEdit(): void }) {
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setFailure(null)
    try {
      await action()
      await refreshCabinet()
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  const toggleHidden = () =>
    run(() =>
      unwrap(
        api.PUT("/v1/me/listings/{id}", {
          params: { path: { id: listing.id } },
          body: listingRequest({ ...listingValuesOf(listing), hidden: listing.status !== "HIDDEN" }, listing.attributes, listing.city?.id),
        }),
      ),
    )

  const remove = () => {
    if (!window.confirm(`Удалить позицию «${listing.title}»?`)) return
    void run(() => expectOk(api.DELETE("/v1/me/listings/{id}", { params: { path: { id: listing.id } } })))
  }

  const addPhoto = (file: File) => {
    const problem = imageFileProblem(file)
    if (problem) return setFailure(problem)
    void run(async () => {
      const media = await uploadImage(file)
      await unwrap(api.POST("/v1/me/listings/{id}/photos", { params: { path: { id: listing.id } }, body: { mediaId: media.id } }))
    })
  }

  const removePhoto = (photoId: string) =>
    run(() => expectOk(api.DELETE("/v1/me/listings/{id}/photos/{photoId}", { params: { path: { id: listing.id, photoId } } })))

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{listing.title}</h3>
        <Badge variant="outline">{LISTING_TYPE_LABELS[listing.type]}</Badge>
        <ReviewBadge status={listing.reviewStatus} />
        {listing.status === "HIDDEN" ? <Badge variant="secondary">Скрыта</Badge> : null}
        <span className="ml-auto font-medium">{formatPriceFrom(listing.priceFromMinor, listing.currency)}</span>
      </div>
      {listing.rejectionReason ? <FormAlert message={`Отклонено: ${listing.rejectionReason}`} /> : null}
      {failure ? <FormAlert message={failure} /> : null}
      {listing.photos.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {listing.photos.map((photo) => (
            <li key={photo.id} className="flex w-28 flex-col gap-1">
              <EggImage image={photo.image} alt="" sizes="112px" className="aspect-square w-full rounded-lg object-cover" />
              <ReviewBadge status={photo.reviewStatus} />
              <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => void removePhoto(photo.id)}>
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <UploadButton label="Добавить фото" busy={busy} onFile={addPhoto} />
        <Button type="button" variant="outline" onClick={onEdit}>
          Изменить
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => void toggleHidden()}>
          {listing.status === "HIDDEN" ? "Показать в каталоге" : "Скрыть"}
        </Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={remove}>
          Удалить
        </Button>
      </div>
    </li>
  )
}

function ListingsBody() {
  const { data, error, isLoading } = useMyListings()
  const [editing, setEditing] = useState<MyListing | "new" | null>(null)
  const close = () => setEditing(null)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Позиции</h2>
        <Button onClick={() => setEditing("new")}>Добавить позицию</Button>
      </div>
      <p className="text-sm text-muted-foreground">Новые позиции и фото видны посетителям после проверки.</p>
      {error ? <FormAlert message={errorTextOf(error)} /> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Загружаем…</p> : null}
      {data && data.items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Позиций пока нет.</p> : null}
      <ul className="flex flex-col gap-4">
        {data?.items.map((listing) => (
          <ListingRow key={listing.id} listing={listing} onEdit={() => setEditing(listing)} />
        ))}
      </ul>
      <Dialog open={editing !== null} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? "Новая позиция" : "Изменить позицию"}</DialogTitle>
            <DialogDescription>Услуга, готовый товар или работа на заказ.</DialogDescription>
          </DialogHeader>
          {editing !== null ? <ListingForm listing={editing === "new" ? null : editing} onSaved={close} /> : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function ListingsManager() {
  return <CreatorGate>{() => <ListingsBody />}</CreatorGate>
}
