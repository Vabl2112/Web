"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { CreatorGate } from "@/components/cabinet/creator-gate"
import { SelectField, TextAreaField } from "@/components/cabinet/fields"
import { UploadButton } from "@/components/cabinet/upload-button"
import { EggImage } from "@/components/egg-image"
import { Button } from "@/components/ui/button"
import { expectOk, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf } from "@/lib/api/errors"
import type { MyCreatorProfile } from "@/lib/cabinet"
import { type ProfileValues, profileRequest, profileSchema, profileValuesOf } from "@/lib/cabinet-schemas"
import { refreshCabinet, useCategories, useMyProfile } from "@/lib/cabinet-hooks"
import { applyFieldErrors } from "@/lib/form-errors"
import { imageFileProblem, uploadImage } from "@/lib/media"

function Avatar({ profile, onChange, busy }: { profile: MyCreatorProfile; onChange(file: File): void; busy: boolean }) {
  const remove = async () => {
    await expectOk(api.DELETE("/v1/me/creator-profile/avatar"))
    await refreshCabinet()
  }
  return (
    <div className="flex items-center gap-4">
      {profile.avatar ? (
        <EggImage image={profile.avatar.image} alt="Аватар" sizes="96px" className="size-24 rounded-full object-cover" />
      ) : (
        <span aria-hidden className="flex size-24 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground">
          Нет аватара
        </span>
      )}
      <div className="flex flex-col items-start gap-2">
        <UploadButton label={profile.avatar ? "Заменить аватар" : "Загрузить аватар"} busy={busy} onFile={onChange} />
        {profile.avatar ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => void remove()}>
            Удалить аватар
          </Button>
        ) : null}
        {profile.pendingAvatar ? <p className="text-sm text-muted-foreground">Новый аватар ждёт проверки.</p> : null}
      </div>
    </div>
  )
}

function ProfileFormBody({ profile }: { profile: MyCreatorProfile }) {
  const categories = useCategories()
  const { change } = useMyProfile()
  const [note, setNote] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileValues>({ resolver: zodResolver(profileSchema), defaultValues: profileValuesOf(profile) })

  const saveWith = async (values: ProfileValues, avatarMediaId?: string) => {
    const saved = await unwrap(api.PUT("/v1/me/creator-profile", { body: { ...profileRequest(values), ...(avatarMediaId ? { avatarMediaId } : {}) } }))
    await change(saved, { revalidate: false })
    await refreshCabinet()
  }

  const fail = (error: unknown) => {
    const shown = error instanceof ApiError && applyFieldErrors(error, setError, { displayName: "displayName", bio: "bio", categoryId: "categoryId" })
    setFailure(shown ? null : errorTextOf(error))
  }

  const save = handleSubmit(async (values) => {
    setNote(null)
    setFailure(null)
    try {
      await saveWith(values)
      setNote("Сохранено.")
    } catch (error) {
      fail(error)
    }
  })

  const changeAvatar = async (file: File) => {
    setNote(null)
    const problem = imageFileProblem(file)
    if (problem) return setFailure(problem)
    setFailure(null)
    setUploading(true)
    try {
      const media = await uploadImage(file)
      await saveWith(getValues(), media.id)
      setNote("Новый аватар отправлен на проверку.")
    } catch (error) {
      fail(error)
    } finally {
      setUploading(false)
    }
  }

  if (categories.length === 0) return <p className="text-sm text-muted-foreground">Загружаем…</p>

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <Avatar profile={profile} onChange={(file) => void changeAvatar(file)} busy={uploading} />
      <form onSubmit={save} noValidate className="flex flex-col gap-4">
        {failure ? <FormAlert message={failure} /> : null}
        {note ? <FormAlert tone="info" message={note} /> : null}
        <TextField label="Название витрины" hint="Имя или название студии, как его увидят посетители." error={errors.displayName?.message} {...register("displayName")} />
        <SelectField
          label="Категория"
          placeholder="Выберите категорию"
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          error={errors.categoryId?.message}
          {...register("categoryId")}
        />
        <TextAreaField label="О себе" rows={6} error={errors.bio?.message} {...register("bio")} />
        <TextField label="Теги" hint="Через запятую, не больше 10: например, «кружки, ручная работа»." error={errors.tags?.message} {...register("tags")} />
        <Button type="submit" className="w-fit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем…" : "Сохранить"}
        </Button>
      </form>
    </div>
  )
}

/** The text of the showcase and its avatar. Saving a published showcase sends the changes to review; the visitors see the old text until then. */
export function ProfileForm() {
  return <CreatorGate>{(profile) => <ProfileFormBody profile={profile} />}</CreatorGate>
}
