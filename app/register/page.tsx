import type { Metadata } from "next"
import Link from "next/link"
import { AuthSplitShell } from "@/components/auth/auth-split-shell"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = { title: "Регистрация — EGG" }

/** What the dark side of the page promises; the first prototype also promised favourites, which the platform does not have. */
const POINTS = [
  { title: "Уникальные работы", text: "Картины, керамика, украшения, мебель и многое другое" },
  { title: "Прямой контакт", text: "Общайтесь с мастерами и договаривайтесь напрямую" },
  { title: "Своя витрина", text: "Покажите свои работы, услуги и товары, когда будете готовы" },
]

export default function RegisterPage() {
  return (
    <AuthSplitShell
      pitch="Присоединяйтесь к нам"
      pitchText="Создайте аккаунт и откройте для себя мир творческих людей и уникальных работ"
      points={POINTS}
      title="Создать аккаунт"
      description="Аккаунт нужен, чтобы писать мастерам. Создать свою витрину можно потом."
      aside={
        <>
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthSplitShell>
  )
}
