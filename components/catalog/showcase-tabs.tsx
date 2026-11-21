"use client"

import { type ReactNode, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ShowcaseTab {
  id: string
  label: string
  content: ReactNode
}

/** The sections of a showcase as tabs with an underline; a section that has nothing to show is not passed in at all. */
export function ShowcaseTabs({ tabs }: { tabs: ShowcaseTab[] }) {
  const [chosen, setChosen] = useState(tabs[0]?.id ?? "")
  // The page is read again after a change and the set of sections may be another one: a chosen section that is gone gives way to the first.
  const current = tabs.some((tab) => tab.id === chosen) ? chosen : (tabs[0]?.id ?? "")

  if (tabs.length === 0) return null
  return (
    <Tabs value={current} onValueChange={setChosen} className="w-full">
      <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="rounded-none border-0 border-b-2 border-transparent px-4 py-2 text-sm font-medium data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <div className="mt-1 h-px w-full bg-border" />
      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
