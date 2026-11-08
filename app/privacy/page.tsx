import type { Metadata } from "next"
import { Header } from "@/components/header"
import { LegalArticle } from "@/components/legal-article"

export const metadata: Metadata = { title: "Политика обработки персональных данных — EGG" }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <LegalArticle title="Политика обработки персональных данных">
        <p>Здесь будет полный текст политики. Пока это временная страница, чтобы при регистрации было на что сослаться.</p>
        <h2 className="text-xl font-semibold">Что сервис хранит сейчас</h2>
        <ul className="list-disc pl-6">
          <li>адрес электронной почты и имя, которые вы указали при регистрации;</li>
          <li>версию текста, который вы приняли при регистрации;</li>
          <li>сведения о том, что вы вошли в аккаунт, пока вы не вышли или не истёк срок входа.</li>
        </ul>
      </LegalArticle>
    </div>
  )
}
