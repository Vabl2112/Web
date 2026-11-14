"use client"

import { type ReactNode, useState } from "react"
import { Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ShowcaseTab {
  id: string
  label: string
  content: ReactNode
}

/**
 * The sections of a showcase as tabs with an underline. The gear on the right lets a visitor hide the sections they do not need (at
 * least one stays); a section that has nothing to show is not passed in at all.
 */
export function ShowcaseTabs({ tabs }: { tabs: ShowcaseTab[] }) {
  const [hidden, setHidden] = useState<string[]>([])
  const [chosen, setChosen] = useState(tabs[0]?.id ?? "")
  const visible = tabs.filter((tab) => !hidden.includes(tab.id))
  const current = visible.some((tab) => tab.id === chosen) ? chosen : (visible[0]?.id ?? "")

  const toggle = (id: string) =>
    setHidden((before) => {
      if (before.includes(id)) return before.filter((other) => other !== id)
      return visible.length <= 1 ? before : [...before, id]
    })

  if (tabs.length === 0) return null
  return (
    <Tabs value={current} onValueChange={setChosen} className="w-full">
      <div className="flex items-start justify-between gap-2">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {visible.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-none border-0 border-b-2 border-transparent px-4 py-2 text-sm font-medium data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Settings2 className="size-4" />
                <span className="sr-only">Настроить разделы</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Показывать разделы</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tabs.map((tab) => (
                <DropdownMenuCheckboxItem
                  key={tab.id}
                  checked={!hidden.includes(tab.id)}
                  onCheckedChange={() => toggle(tab.id)}
                  disabled={visible.length === 1 && !hidden.includes(tab.id)}
                >
                  {tab.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <div className="mt-1 h-px w-full bg-border" />
      {visible.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
