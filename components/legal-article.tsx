import type { ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CONSENT_VERSION } from "@/lib/consent"

/** The body of the legal pages. Until P8.2 the texts are drafts, and the page says so at the top so nobody takes it for the final text. */
export function LegalArticle({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Alert>
        <AlertTitle>Черновик</AlertTitle>
        <AlertDescription>
          Это временный текст. Окончательную редакцию утвердит владелец сервиса до открытия регистрации. Версия текста: {CONSENT_VERSION}.
        </AlertDescription>
      </Alert>
      <div className="flex flex-col gap-4 leading-relaxed">{children}</div>
    </article>
  )
}
