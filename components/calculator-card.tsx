"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calculator } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { CalculatorConfig, CalculatorParameter } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface CalculatorCardProps {
  artistId?: string
}

export function CalculatorCard({ artistId = "1" }: CalculatorCardProps) {
  const { data: config, isLoading } = useSWR<CalculatorConfig>(
    `/api/calculator/${artistId}`,
    fetcher
  )
  
  // The values the user changed; everything else comes from the defaults of the loaded config.
  const [overrides, setOverrides] = useState<Record<string, string | number>>({})

  const values = useMemo(() => {
    const defaults: Record<string, string | number> = {}
    config?.parameters?.forEach(param => {
      defaults[param.id] = param.defaultValue
    })
    return { ...defaults, ...overrides }
  }, [config, overrides])

  const updateValue = (id: string, value: string | number) => {
    setOverrides(prev => ({ ...prev, [id]: value }))
  }

  const calculatedPrice = useMemo(() => {
    if (!config?.formula || Object.keys(values).length === 0) return 0
    
    try {
      // Create a safe evaluation context with parameter values
      let formula = config.formula
      Object.entries(values).forEach(([key, value]) => {
        const numValue = typeof value === 'string' ? 
          (config.parameters.find(p => p.id === key)?.options?.findIndex(o => o.value === value) || 0) + 1 : 
          value
        formula = formula.replace(new RegExp(`\\$${key}`, 'g'), String(numValue))
      })
      
      // Safe math evaluation (only allows numbers and basic operators)
      const sanitized = formula.replace(/[^0-9+\-*/().]/g, '')
      return Math.round(new Function(`return ${sanitized}`)())
    } catch {
      return 0
    }
  }, [config, values])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU").format(price)
  }

  const renderParameter = (param: CalculatorParameter) => {
    const value = values[param.id]
    
    switch (param.type) {
      case "slider":
        return (
          <div key={param.id} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium text-foreground">
                {param.label}
              </Label>
              <span className="rounded-md bg-foreground px-2.5 py-1 text-sm font-semibold text-background">
                {value}{param.unit || ""}
              </span>
            </div>
            <Slider
              value={[Number(value) || param.min || 0]}
              onValueChange={([v]) => updateValue(param.id, v)}
              min={param.min || 0}
              max={param.max || 100}
              step={param.step || 1}
              className="w-full"
            />
            {param.marks && (
              <div className="flex justify-between text-xs text-muted-foreground">
                {param.marks.map(mark => (
                  <span key={mark.value}>{mark.label}</span>
                ))}
              </div>
            )}
          </div>
        )
      
      case "radio":
        return (
          <div key={param.id} className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">
              {param.label}
            </Label>
            <RadioGroup 
              value={String(value)} 
              onValueChange={(v) => updateValue(param.id, v)}
              className="flex flex-wrap gap-0 rounded-full border border-border bg-background p-1"
            >
              {param.options?.map(option => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem 
                    value={option.value} 
                    id={`${param.id}-${option.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`${param.id}-${option.value}`}
                    className="cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors peer-data-[state=checked]:bg-foreground peer-data-[state=checked]:text-background hover:bg-muted"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      
      case "select":
        return (
          <div key={param.id} className="flex flex-col gap-2">
            <Label className="text-sm font-medium text-foreground">
              {param.label}
            </Label>
            <Select value={String(value)} onValueChange={(v) => updateValue(param.id, v)}>
              <SelectTrigger className="rounded-full border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-6 sm:grid-cols-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!config) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Рассчитай стоимость тату
        </h2>
        <Calculator className="size-6 text-foreground" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Parameters */}
        <div className="grid gap-6 sm:grid-cols-2">
          {config.parameters.map(renderParameter)}
        </div>

        {/* Price Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6">
          <div className="text-center">
            <span className="text-4xl font-bold text-foreground">
              ≈ {formatPrice(calculatedPrice)} {config.currency}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              Примерная стоимость
            </p>
          </div>
          
          <Button className="mt-6 w-full rounded-full py-6 text-base font-semibold">
            Записаться с этим расчетом
          </Button>
        </div>
      </div>
    </div>
  )
}
