"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { FormAlert } from "@/components/auth/form-alert"
import { TextField } from "@/components/auth/text-field"
import { CreatorGate } from "@/components/cabinet/creator-gate"
import { SelectField } from "@/components/cabinet/fields"
import { CalculatorView } from "@/components/catalog/calculator-card"
import { Button } from "@/components/ui/button"
import { expectOk, unwrap } from "@/lib/api/answers"
import { api } from "@/lib/api/client"
import { ApiError, errorTextOf, fieldErrorsOf } from "@/lib/api/errors"
import type { Calculator, CalculatorParameter } from "@/lib/calculator"
import {
  CURRENCIES,
  MAX_OPTIONS,
  MAX_PARAMETERS,
  STARTER,
  formulaProblem,
  freeId,
  newChoice,
  newSlider,
  withKind,
} from "@/lib/calculator-draft"
import { refreshCabinet, useMyCalculator } from "@/lib/cabinet-hooks"

type Errors = Record<string, string>

function NumberField({
  label,
  value,
  onChange,
  error,
}: {
  label: string
  value: number | undefined
  onChange(value: number | undefined): void
  error?: string
}) {
  return (
    <TextField
      label={label}
      type="number"
      step="any"
      value={value ?? ""}
      error={error}
      onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
    />
  )
}

interface ParameterEditorProps {
  parameter: CalculatorParameter
  index: number
  errors: Errors
  canRemove: boolean
  onChange(next: CalculatorParameter): void
  onRemove(): void
}

function OptionsEditor({ parameter, at, errors, onChange }: { parameter: CalculatorParameter; at: string; errors: Errors; onChange(next: CalculatorParameter): void }) {
  const options = parameter.options ?? []
  const setOptions = (next: typeof options, defaultOption = parameter.defaultOption ?? 0) =>
    onChange({ ...parameter, options: next, defaultOption: Math.min(defaultOption, next.length - 1) })
  return (
    <div className="flex flex-col gap-3 sm:col-span-2">
      <p className="text-sm font-medium">Варианты ответа</p>
      {errors[`${at}.options`] ? (
        <p role="alert" className="text-sm text-destructive">
          {errors[`${at}.options`]}
        </p>
      ) : null}
      {options.map((option, position) => (
        <div key={position} className="grid grid-cols-[1fr_8rem_auto] items-end gap-2">
          <TextField
            label={`Вариант ${position + 1}`}
            value={option.label}
            error={errors[`${at}.options[${position}].label`]}
            onChange={(event) => setOptions(options.map((other, i) => (i === position ? { ...other, label: event.target.value } : other)))}
          />
          <NumberField
            label="Число"
            value={option.value}
            error={errors[`${at}.options[${position}].value`]}
            onChange={(value) => setOptions(options.map((other, i) => (i === position ? { ...other, value: value ?? 0 } : other)))}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Убрать вариант ${position + 1}`}
            disabled={options.length <= 2}
            onClick={() => setOptions(options.filter((_, i) => i !== position))}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <div className="flex flex-wrap items-end gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={options.length >= MAX_OPTIONS}
          onClick={() => setOptions([...options, { label: `Вариант ${options.length + 1}`, value: 1 }])}
        >
          <Plus className="size-4" />
          Добавить вариант
        </Button>
        <div className="min-w-48">
          <SelectField
            label="Выбран сначала"
            value={String(parameter.defaultOption ?? 0)}
            options={options.map((option, position) => ({ value: String(position), label: option.label || `Вариант ${position + 1}` }))}
            error={errors[`${at}.defaultOption`]}
            onChange={(event) => onChange({ ...parameter, defaultOption: Number(event.target.value) })}
          />
        </div>
      </div>
    </div>
  )
}

function ParameterEditor({ parameter, index, errors, canRemove, onChange, onRemove }: ParameterEditorProps) {
  const at = `parameters[${index}]`
  const set = (patch: Partial<CalculatorParameter>) => onChange({ ...parameter, ...patch })
  return (
    <fieldset className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2">
      <legend className="px-2 text-sm font-medium">Вопрос {index + 1}</legend>
      <TextField label="Вопрос посетителю" value={parameter.label} error={errors[`${at}.label`]} onChange={(event) => set({ label: event.target.value })} />
      <TextField
        label="Имя в формуле"
        value={parameter.id}
        hint="Латиница, цифры и _, с буквы."
        error={errors[`${at}.id`]}
        onChange={(event) => set({ id: event.target.value })}
      />
      <SelectField
        label="Вид"
        value={parameter.kind}
        options={[
          { value: "SLIDER", label: "Ползунок (число)" },
          { value: "CHOICE", label: "Выбор из вариантов" },
        ]}
        onChange={(event) => onChange(withKind(parameter, event.target.value as CalculatorParameter["kind"]))}
      />
      {parameter.kind === "SLIDER" ? (
        <>
          <TextField label="Единица (необязательно)" value={parameter.unit ?? ""} maxLength={10} error={errors[`${at}.unit`]} onChange={(event) => set({ unit: event.target.value })} />
          <NumberField label="Наименьшее" value={parameter.min} error={errors[`${at}.min`]} onChange={(min) => set({ min })} />
          <NumberField label="Наибольшее" value={parameter.max} error={errors[`${at}.max`]} onChange={(max) => set({ max })} />
          <NumberField label="Шаг" value={parameter.step} error={errors[`${at}.step`]} onChange={(step) => set({ step })} />
          <NumberField label="Стоит сначала" value={parameter.defaultValue} error={errors[`${at}.defaultValue`]} onChange={(defaultValue) => set({ defaultValue })} />
        </>
      ) : (
        <OptionsEditor parameter={parameter} at={at} errors={errors} onChange={onChange} />
      )}
      <div className="sm:col-span-2">
        <Button type="button" variant="ghost" size="sm" disabled={!canRemove} onClick={onRemove}>
          <Trash2 className="size-4" />
          Убрать вопрос
        </Button>
      </div>
    </fieldset>
  )
}

function EditorBody({ initial, exists }: { initial: Calculator; exists: boolean }) {
  const { change } = useMyCalculator()
  const [draft, setDraft] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [saved, setSaved] = useState(exists)
  const problem = formulaProblem(draft)

  const edit = (next: Calculator) => {
    setDraft(next)
    setNote(null)
  }
  const setParameter = (index: number, next: CalculatorParameter) =>
    edit({ ...draft, parameters: draft.parameters.map((parameter, i) => (i === index ? next : parameter)) })

  const save = async () => {
    setBusy(true)
    setFailure(null)
    setErrors({})
    try {
      const stored = await unwrap(api.PUT("/v1/me/calculator", { body: draft }))
      await change(stored, { revalidate: false })
      await refreshCabinet()
      setDraft(stored)
      setSaved(true)
      setNote("Калькулятор сохранён и виден на вашей витрине.")
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        setErrors(fieldErrorsOf(error))
        setFailure("Проверьте поля, отмеченные красным.")
      } else {
        setFailure(errorTextOf(error))
      }
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    setFailure(null)
    try {
      await expectOk(api.DELETE("/v1/me/calculator"))
      await refreshCabinet()
      setDraft(STARTER)
      setSaved(false)
      setConfirmRemove(false)
      setNote("Калькулятор убран с витрины.")
    } catch (error) {
      setFailure(errorTextOf(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-semibold">Калькулятор цены</h2>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Посетители отвечают на ваши вопросы, а формула считает примерную цену. Калькулятор показывается на вкладке вашей витрины.
          {saved ? "" : " Пока он не сохранён, посетители его не видят."}
        </p>
      </div>

      {failure ? <FormAlert message={failure} /> : null}
      {note ? <FormAlert tone="info" message={note} /> : null}

      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault()
          void save()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
          <TextField label="Заголовок" value={draft.title} maxLength={80} error={errors.title} onChange={(event) => edit({ ...draft, title: event.target.value })} />
          <SelectField
            label="Валюта"
            value={draft.currency}
            options={CURRENCIES.map((code) => ({ value: code, label: code }))}
            onChange={(event) => edit({ ...draft, currency: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-4">
          {draft.parameters.map((parameter, index) => (
            <ParameterEditor
              key={index}
              parameter={parameter}
              index={index}
              errors={errors}
              canRemove={draft.parameters.length > 1}
              onChange={(next) => setParameter(index, next)}
              onRemove={() => edit({ ...draft, parameters: draft.parameters.filter((_, i) => i !== index) })}
            />
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={draft.parameters.length >= MAX_PARAMETERS}
              onClick={() => edit({ ...draft, parameters: [...draft.parameters, newSlider(freeId(draft.parameters))] })}
            >
              <Plus className="size-4" />
              Добавить ползунок
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={draft.parameters.length >= MAX_PARAMETERS}
              onClick={() => edit({ ...draft, parameters: [...draft.parameters, newChoice(freeId(draft.parameters))] })}
            >
              <Plus className="size-4" />
              Добавить выбор
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <TextField
            label="Формула цены"
            value={draft.formula}
            maxLength={300}
            error={errors.formula ?? problem ?? undefined}
            hint="Числа, имена вопросов, + − * /, скобки и min(a, b), max(a, b). Результат — сумма в выбранной валюте."
            onChange={(event) => edit({ ...draft, formula: event.target.value })}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Добавить имя:</span>
            {draft.parameters.map((parameter, index) => (
              <Button
                key={index}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => edit({ ...draft, formula: `${draft.formula} ${parameter.id}`.trim() })}
              >
                {parameter.id}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Сохраняем…" : "Сохранить калькулятор"}
          </Button>
          {saved && !confirmRemove ? (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setConfirmRemove(true)}>
              Убрать калькулятор
            </Button>
          ) : null}
          {confirmRemove ? (
            <>
              <span className="text-sm">Убрать калькулятор с витрины?</span>
              <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void remove()}>
                Да, убрать
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRemove(false)}>
                Отмена
              </Button>
            </>
          ) : null}
        </div>
      </form>

      <section aria-labelledby="preview" className="flex flex-col gap-4 border-t border-border pt-6">
        <h3 id="preview" className="text-lg font-semibold">
          Так увидят посетители
        </h3>
        <CalculatorView key={JSON.stringify(draft)} calculator={draft} />
      </section>
    </div>
  )
}

function CalculatorEditorLoader() {
  const { calculator, isLoading, none, error } = useMyCalculator()
  if (isLoading) return <p className="text-sm text-muted-foreground">Загружаем…</p>
  if (error) return <FormAlert message={errorTextOf(error)} />
  if (!calculator && !none) return null
  return <EditorBody initial={calculator ?? STARTER} exists={calculator !== undefined} />
}

export function CalculatorEditor() {
  return <CreatorGate>{() => <CalculatorEditorLoader />}</CreatorGate>
}
