import { MetricsView } from "@/components/admin/metrics-view"

export default function MetricsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold">Метрики</h1>
      <p className="text-muted-foreground">Последние месяцы пилота. Тестовые аккаунты не учитываются.</p>
      <MetricsView />
    </>
  )
}
