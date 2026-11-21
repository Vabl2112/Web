"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { type UseFormReturn, useForm, useWatch } from "react-hook-form"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { SelectField } from "@/components/cabinet/fields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf } from "@/lib/api/errors"
import type { MyPortfolioItem } from "@/lib/cabinet"
import { refreshCabinet, useCategories } from "@/lib/cabinet-hooks"
import { type PortfolioValues, portfolioFields, portfolioSchema, portfolioValuesOf } from "@/lib/cabinet-schemas"
import { applyFieldErrors } from "@/lib/form-errors"

/** The names of the fields of a work in the form and in the answers of the API are the same. */
export const WORK_FIELD_ERRORS = { categoryId: "categoryId", subcategoryId: "subcategoryId", title: "title" } as const

/** The category, the subcategory (only when the chosen category has some) and the title of a work: a new one and a change use the same. */
export function WorkFields({ form }: { form: UseFormReturn<PortfolioValues> }) {
  const categories = useCategories()
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form
  const chosen = useWatch({ control, name: "categoryId" })
  const children = categories.find((category) => category.id === chosen)?.children ?? []
  return (
    <>
      <SelectField
        label="Категория"
        placeholder="Выберите категорию"
        options={categories.map((category) => ({ value: category.id, label: category.name }))}
        error={errors.categoryId?.message}
        // A subcategory belongs to one category: another category leaves the old choice behind, and the API refuses the pair.
        {...register("categoryId", { onChange: () => setValue("subcategoryId", "") })}
      />
      {children.length > 0 ? (
        <SelectField
          label="Подкатегория"
          placeholder="Не выбрана"
          options={children.map((child) => ({ value: child.id, label: child.name }))}
          error={errors.subcategoryId?.message}
          {...register("subcategoryId")}
        />
      ) : null}
      <TextField label="Название" hint="Необязательно." error={errors.title?.message} {...register("title")} />
    </>
  )
}

function EditWorkForm({ item, onDone }: { item: MyPortfolioItem; onDone(): void }) {
  const categories = useCategories()
  const [failure, setFailure] = useState<string | null>(null)
  const form = useForm<PortfolioValues>({ resolver: zodResolver(portfolioSchema), defaultValues: portfolioValuesOf(item) })
  const {
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = form

  const save = handleSubmit(async (values) => {
    setFailure(null)
    try {
      await unwrap(api.PUT("/v1/me/portfolio-items/{id}", { params: { path: { id: item.id } }, body: portfolioFields(values) }))
      await refreshCabinet()
      onDone()
    } catch (error) {
      const shown = error instanceof ApiError && applyFieldErrors(error, setError, WORK_FIELD_ERRORS)
      setFailure(shown ? null : errorTextOf(error))
    }
  })

  // The selects start with what the work has, so they wait until the list of categories is there to hold it.
  if (categories.length === 0) return <p className="text-sm text-muted-foreground">Загружаем…</p>
  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-4">
      {failure ? <FormAlert message={failure} /> : null}
      <WorkFields form={form} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняем…" : "Сохранить"}
        </Button>
      </DialogFooter>
    </form>
  )
}

/** "Изменить" on the tile of a work: a window with the category, the subcategory and the title (`updateMyPortfolioItem`). */
export function EditWorkButton({ item, disabled }: { item: MyPortfolioItem; disabled: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        Изменить
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить работу</DialogTitle>
            <DialogDescription>
              Изображение и место в портфолио не меняются. Если работа уже одобрена, правки видны сразу, а администратор проверит их позже.
            </DialogDescription>
          </DialogHeader>
          <EditWorkForm item={item} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
