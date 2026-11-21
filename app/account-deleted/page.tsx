import type { Metadata } from "next"
import Link from "next/link"
import { PageShell } from "@/components/catalog/page-shell"
import { Button } from "@/components/ui/button"

// Nobody needs it in a search: it is the last page of a person who has left.
export const metadata: Metadata = { title: "Аккаунт удалён — EGG", robots: { index: false } }

/** Where the person lands after deleting the account: what happened, in the words of the privacy policy, and the way back. */
export default function AccountDeletedPage() {
  return (
    <PageShell title="Аккаунт удалён" description="Войти в него больше нельзя, все входы завершены.">
      <p className="max-w-xl text-muted-foreground">
        Витрина снята с публикации, а ваши имя, почта и аватар обезличатся в течение 30 дней. Если захотите вернуться, зарегистрируйтесь заново.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/">На главную</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Регистрация</Link>
        </Button>
      </div>
    </PageShell>
  )
}
