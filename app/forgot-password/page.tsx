import type { Metadata } from "next"
import { AuthShell } from "@/components/auth/auth-shell"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = { title: "Восстановление пароля — EGG" }

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Восстановление пароля" description="Укажите почту аккаунта, мы пришлём ссылку для нового пароля.">
      <ForgotPasswordForm />
    </AuthShell>
  )
}
