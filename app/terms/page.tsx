import type { Metadata } from "next"
import { Header } from "@/components/header"
import { LegalArticle } from "@/components/legal-article"

export const metadata: Metadata = { title: "Условия использования — EGG" }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LegalArticle title="Условия использования">
        <p>Здесь будет полный текст условий. Пока это временная страница, чтобы при регистрации было на что сослаться.</p>
        <h2 className="text-xl font-semibold">Возраст</h2>
        <p>Регистрация доступна только совершеннолетним: при регистрации вы подтверждаете, что вам исполнилось 18 лет.</p>
      </LegalArticle>
    </div>
  )
}
