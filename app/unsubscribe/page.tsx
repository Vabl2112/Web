import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { UnsubscribeConfirm } from "@/components/auth/unsubscribe-confirm"
import { firstOf, type SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Отписка от писем — EGG", referrer: "no-referrer", robots: { index: false } }

export default async function UnsubscribePage({ searchParams }: { searchParams: SearchParams }) {
  const token = firstOf((await searchParams).token)
  return (
    <AuthShell title="Отписка от писем">
      <UnsubscribeConfirm token={token} />
    </AuthShell>
  )
}
