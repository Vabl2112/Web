import { ModerationQueue } from "@/components/admin/moderation-queue"
import { parseQueueState } from "@/lib/moderation"
import { firstOf, type SearchParams } from "@/lib/search-params"

export default async function ModerationPage({ searchParams }: { searchParams: SearchParams }) {
  const state = parseQueueState(firstOf((await searchParams).state))
  return (
    <>
      <h1 className="text-3xl font-bold">Модерация</h1>
      <ModerationQueue key={state} state={state} />
    </>
  )
}
