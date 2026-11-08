import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Регистрация — EGG" }

export default function RegisterPage() {
  return (
    <AuthShell title="Регистрация" description="Аккаунт нужен, чтобы писать создателям. Создать свою витрину можно потом.">
      <RegisterForm />
    </AuthShell>
  )
}
