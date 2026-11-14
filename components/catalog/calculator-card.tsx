"use client"

import { useId, useState } from "react"
import { Calculator as CalculatorIcon } from "lucide-react"
import { WriteButton } from "@/components/messaging/write-button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { type Calculator, type CalculatorParameter, formatWhole, initialAnswers, priceOf, summaryOf } from "@/lib/calculator"

/** A choice of up to this many options is shown as a row of pills; a longer one as a list to pick from. */
const PILLS_UP_TO = 4

interface ControlProps {
  parameter: CalculatorParameter
  value: number
  onChange(value: number): void
}

function SliderControl({ parameter, value, onChange }: ControlProps) {
  const min = parameter.min ?? 0
  const max = parameter.max ?? 100
  const unit = parameter.unit ? ` ${parameter.unit}` : ""
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium">{parameter.label}</Label>
        <span className="rounded-md bg-foreground px-2.5 py-1 text-sm font-semibold text-background">
          {value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([next]) => onChange(next)}
        min={min}
        max={max}
        step={parameter.step ?? 1}
        aria-label={parameter.label}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function ChoiceControl({ parameter, value, onChange }: ControlProps) {
  const group = useId()
  const options = parameter.options ?? []
  if (options.length > PILLS_UP_TO) {
    return (
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">{parameter.label}</Label>
        <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
          <SelectTrigger className="rounded-full border-border" aria-label={parameter.label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option, index) => (
              <SelectItem key={index} value={String(index)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">{parameter.label}</Label>
      <RadioGroup
        value={String(value)}
        onValueChange={(next) => onChange(Number(next))}
        aria-label={parameter.label}
        className="flex flex-wrap gap-0 rounded-full border border-border bg-background p-1"
      >
        {options.map((option, index) => (
          <div key={index} className="flex items-center">
            <RadioGroupItem value={String(index)} id={`${group}-${index}`} className="peer sr-only" />
            <Label
              htmlFor={`${group}-${index}`}
              className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors peer-data-[state=checked]:bg-foreground peer-data-[state=checked]:text-background hover:bg-muted"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}

interface CalculatorViewProps {
  calculator: Calculator
  /** Whose calculator it is; without it (the preview in the cabinet) there is no button to write. */
  creatorId?: string
}

/**
 * The price calculator of a showcase: the questions on the left, the approximate price on the right, and a button that opens the form
 * to write to the creator with the choices already in the text. The price is worked out here from the formula the creator set.
 */
export function CalculatorView({ calculator, creatorId }: CalculatorViewProps) {
  const [answers, setAnswers] = useState(() => initialAnswers(calculator))
  const price = priceOf(calculator, answers)
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{calculator.title}</h2>
        <CalculatorIcon aria-hidden className="size-6" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-6 sm:grid-cols-2">
          {calculator.parameters.map((parameter) => {
            const Control = parameter.kind === "SLIDER" ? SliderControl : ChoiceControl
            return (
              <Control
                key={parameter.id}
                parameter={parameter}
                value={answers[parameter.id] ?? 0}
                onChange={(next) => setAnswers((before) => ({ ...before, [parameter.id]: next }))}
              />
            )
          })}
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6">
          <div className="text-center">
            <p className="text-4xl font-bold" aria-live="polite">
              {price === null ? "—" : `≈ ${formatWhole(price, calculator.currency)}`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Примерная стоимость</p>
          </div>
          {creatorId ? (
            <WriteButton
              creatorId={creatorId}
              prominent
              className="w-full px-4"
              label="Написать с этим расчётом"
              prefill={summaryOf(calculator, answers)}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
