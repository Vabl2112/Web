import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { VerifyEmail } from "@/components/auth/verify-email"
import { firstOf, type SearchParams } from "@/lib/search-params"

// The token is in the address: it must not leave in the Referer, and the page is not for search engines.
export const metadata: Metadata = { title: "Подтверждение почты — EGG", referrer: "no-referrer", robots: { index: false } }

export default async function VerifyEmailPage({ searchParams }: { searchParams: SearchParams }) {
  const token = firstOf((await searchParams).token)
  return (
    <AuthShell title="Подтверждение почты">
      <VerifyEmail token={token} />
    </AuthShell>
  )
}
