import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { firstOf, type SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Новый пароль — EGG", referrer: "no-referrer", robots: { index: false } }

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const token = firstOf((await searchParams).token)
  return (
    <AuthShell title="Новый пароль">
      <ResetPasswordForm token={token} />
    </AuthShell>
  )
}
