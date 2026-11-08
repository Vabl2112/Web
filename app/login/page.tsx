import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { returnToOf } from "@/lib/api/client"
import { firstOf, type SearchParams } from "@/lib/search-params"

export const metadata: Metadata = { title: "Вход — EGG" }

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const returnTo = returnToOf(firstOf((await searchParams).returnTo) ?? "")
  return (
    <AuthShell title="Вход" description="Войдите, чтобы писать создателям и вести свою витрину.">
      <LoginForm returnTo={returnTo} />
    </AuthShell>
  )
}
