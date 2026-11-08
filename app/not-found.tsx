import Link from "next/link"
import { PageShell } from "@/components/catalog/page-shell"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <PageShell title="Страница не найдена" description="Такой страницы нет или она больше не опубликована.">
      <Button asChild className="w-fit">
        <Link href="/">На главную</Link>
      </Button>
    </PageShell>
  )
}
