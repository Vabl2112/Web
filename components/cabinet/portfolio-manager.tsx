"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { ReviewBadge } from "@/components/cabinet/badges"
import { CreatorGate } from "@/components/cabinet/creator-gate"
import { SelectField } from "@/components/cabinet/fields"
import { UploadButton } from "@/components/cabinet/upload-button"
import { EggImage } from "@/components/egg-image"
import { Button } from "@/components/ui/button"
import { expectOk, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf } from "@/lib/api/errors"
import type { MyPortfolioItem } from "@/lib/cabinet"
import { type PortfolioValues, portfolioSchema } from "@/lib/cabinet-schemas"
import { refreshCabinet, useCategories, useMyPortfolio } from "@/lib/cabinet-hooks"
import { applyFieldErrors } from "@/lib/form-errors"
import { imageFileProblem, uploadImage } from "@/lib/media"

/** A new work: the image is chosen first, the category (and optionally the subcategory and the title) is filled in, then it is sent. */
function AddWork() {
  const categories = useCategories()
  const [file, setFile] = useState<File | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PortfolioValues>({ resolver: zodResolver(portfolioSchema), defaultValues: { title: "", categoryId: "", subcategoryId: "" } })
  const chosenCategory = useWatch({ control, name: "categoryId" })
  const children = categories.find((category) => category.id === chosenCategory)?.children ?? []

  const choose = (chosen: File) => {
    const problem = imageFileProblem(chosen)
    setFailure(problem)
    setFile(problem ? null : chosen)
  }

  const add = handleSubmit(async (values) => {
    if (file === null) return setFailure("Выберите изображение.")
    setFailure(null)
    try {
      const media = await uploadImage(file)
      await unwrap(
        api.POST("/v1/me/portfolio-items", {
          body: {
            mediaId: media.id,
            categoryId: values.categoryId,
            ...(values.title.trim() !== "" ? { title: values.title.trim() } : {}),
            ...(values.subcategoryId !== "" ? { subcategoryId: values.subcategoryId } : {}),
          },
        }),
      )
      await refreshCabinet()
      reset()
      setFile(null)
    } catch (error) {
      const shown = error instanceof ApiError && applyFieldErrors(error, setError, { categoryId: "categoryId", subcategoryId: "subcategoryId", title: "title" })
      setFailure(shown ? null : errorTextOf(error))
    }
  })

  return (
    <form onSubmit={add} noValidate className="flex max-w-xl flex-col gap-4 rounded-xl border border-border p-4">
      <h3 className="font-semibold">Добавить работу</h3>
      {failure ? <FormAlert message={failure} /> : null}
      <div className="flex flex-wrap items-center gap-3">
        <UploadButton label={file ? "Выбрать другое изображение" : "Выбрать изображение"} onFile={choose} />
        {file ? <span className="truncate text-sm text-muted-foreground">{file.name}</span> : null}
      </div>
      <SelectField
        label="Категория"
        placeholder="Выберите категорию"
        options={categories.map((category) => ({ value: category.id, label: category.name }))}
        error={errors.categoryId?.message}
        {...register("categoryId")}
      />
      {children.length > 0 ? (
        <SelectField
          label="Подкатегория"
          placeholder="Не выбрана"
          options={children.map((child) => ({ value: child.id, label: child.name }))}
          {...register("subcategoryId")}
        />
      ) : null}
      <TextField label="Название" hint="Необязательно." error={errors.title?.message} {...register("title")} />
      <Button type="submit" className="w-fit" disabled={isSubmitting || file === null}>
        {isSubmitting ? "Загружаем…" : "Добавить"}
      </Button>
    </form>
  )
}

function WorkTile({ item, index, count, onMove, onRemove }: { item: MyPortfolioItem; index: number; count: number; onMove(from: number, to: number): void; onRemove(): void }) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border p-3">
      <EggImage image={item.image} alt={item.title ?? ""} sizes="(min-width: 768px) 25vw, 50vw" className="aspect-square w-full rounded-lg object-cover" />
      <div className="flex flex-wrap items-center gap-2">
        <ReviewBadge status={item.reviewStatus} />
        <span className="truncate text-sm">{item.title ?? item.category.name}</span>
      </div>
      {item.rejectionReason ? <p className="text-sm text-destructive">{item.rejectionReason}</p> : null}
      <div className="flex gap-1">
        <Button type="button" variant="outline" size="sm" disabled={index === 0} aria-label="Поднять выше" onClick={() => onMove(index, index - 1)}>
          ←
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={index === count - 1} aria-label="Опустить ниже" onClick={() => onMove(index, index + 1)}>
          →
        </Button>
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onRemove}>
          Удалить
        </Button>
      </div>
    </li>
  )
}

function PortfolioBody() {
  const { data, error, isLoading } = useMyPortfolio()
  const [failure, setFailure] = useState<string | null>(null)
  const items = [...(data?.items ?? [])].sort((a, b) => a.position - b.position)

  const run = async (action: () => Promise<void>) => {
    setFailure(null)
    try {
      await action()
    } catch (problem) {
      setFailure(errorTextOf(problem))
    }
    await refreshCabinet()
  }

  const move = (from: number, to: number) => {
    const order = items.map((item) => item.id)
    order.splice(to, 0, ...order.splice(from, 1))
    void run(() => expectOk(api.PUT("/v1/me/portfolio-items/order", { body: { itemIds: order } })))
  }

  const remove = (item: MyPortfolioItem) => {
    if (!window.confirm("Удалить эту работу?")) return
    void run(() => expectOk(api.DELETE("/v1/me/portfolio-items/{id}", { params: { path: { id: item.id } } })))
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold">Портфолио</h2>
      <p className="text-sm text-muted-foreground">Для отправки витрины на проверку нужно не менее трёх работ. Новые работы видны посетителям после проверки.</p>
      {error ? <FormAlert message={errorTextOf(error)} /> : null}
      {failure ? <FormAlert message={failure} /> : null}
      {isLoading ? <p className="text-sm text-muted-foreground">Загружаем…</p> : null}
      {data && items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">Работ пока нет.</p> : null}
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item, index) => (
          <WorkTile key={item.id} item={item} index={index} count={items.length} onMove={move} onRemove={() => remove(item)} />
        ))}
      </ul>
      <AddWork />
    </section>
  )
}

export function PortfolioManager() {
  return <CreatorGate>{() => <PortfolioBody />}</CreatorGate>
}
