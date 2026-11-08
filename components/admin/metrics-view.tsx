"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { NoAccess } from "@/components/admin/no-access"
import { FormAlert } from "@/components/auth/form-alert"
import { type ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { api } from "@/lib/api/client"
import { errorTextOf } from "@/lib/api/errors"
import { useGet } from "@/lib/api/hooks"
import { ADMIN_PREFIX } from "@/lib/admin-hooks"
import { SHOWCASE_STATUS_LABELS } from "@/lib/cabinet"
import { byMonth, formatRate, latestOf, monthLabel } from "@/lib/metrics"

const QUIET = { shouldRetryOnError: false, revalidateOnFocus: false } as const

const INQUIRY_CONFIG = {
  newConversations: { label: "Новые обращения", color: "var(--chart-1)" },
  conversationsWithCreatorReply: { label: "С ответом создателя", color: "var(--chart-2)" },
} satisfies ChartConfig

const SHOWCASE_CONFIG = {
  newlyPublished: { label: "Опубликовано за месяц", color: "var(--chart-1)" },
  activeShowcases: { label: "Активных витрин", color: "var(--chart-2)" },
} satisfies ChartConfig

function Tile({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border p-4">
      <span className="text-sm text-muted-foreground">{title}</span>
      <span className="text-3xl font-semibold">{value}</span>
    </div>
  )
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-muted-foreground">
          {head.map((title) => (
            <th key={title} className="py-2 pr-4 font-medium">
              {title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row[0]} className="border-b border-border/50">
            {row.map((cell, index) => (
              <td key={`${row[0]}-${head[index]}`} className="py-2 pr-4">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** The numbers of the pilot for the team: the inquiries and their replies, the active and new showcases, the showcases per status. */
export function MetricsView() {
  const inquiries = useGet(`${ADMIN_PREFIX}metrics-inquiries`, () => api.GET("/v1/admin/metrics/inquiries"), QUIET)
  const showcases = useGet(`${ADMIN_PREFIX}metrics-showcases`, () => api.GET("/v1/admin/metrics/showcases"), QUIET)

  if (inquiries.error?.status === 403 || showcases.error?.status === 403) return <NoAccess />
  const failure = inquiries.error ?? showcases.error
  if (failure) return <FormAlert message={errorTextOf(failure)} />
  if (!inquiries.data || !showcases.data) return <p className="text-sm text-muted-foreground">Загружаем…</p>

  const inquiryRows = byMonth(inquiries.data.buckets)
  const showcaseRows = byMonth(showcases.data.buckets)
  const lastInquiry = latestOf(inquiries.data.buckets)
  const lastShowcase = latestOf(showcases.data.buckets)
  const inquiryData = inquiryRows.map((bucket) => ({ ...bucket, month: monthLabel(bucket.periodStart) }))
  const showcaseData = showcaseRows.map((bucket) => ({ ...bucket, month: monthLabel(bucket.periodStart) }))

  return (
    <div className="flex flex-col gap-10">
      <section aria-label="Сводка" className="grid gap-3 sm:grid-cols-3">
        <Tile title="Активных витрин" value={String(lastShowcase?.activeShowcases ?? 0)} />
        <Tile title="Новых обращений за последний месяц" value={String(lastInquiry?.newConversations ?? 0)} />
        <Tile title="Доля обращений с ответом" value={formatRate(lastInquiry?.replyRate)} />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Обращения по месяцам</h2>
        <ChartContainer config={INQUIRY_CONFIG} className="aspect-[2/1] w-full max-w-3xl">
          <BarChart data={inquiryData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="newConversations" fill="var(--color-newConversations)" radius={4} />
            <Bar dataKey="conversationsWithCreatorReply" fill="var(--color-conversationsWithCreatorReply)" radius={4} />
          </BarChart>
        </ChartContainer>
        <Table
          head={["Месяц", "Новые обращения", "С ответом", "Доля ответов", "Активных витрин"]}
          rows={inquiryData.map((bucket) => [
            bucket.month,
            String(bucket.newConversations),
            String(bucket.conversationsWithCreatorReply),
            formatRate(bucket.replyRate),
            String(bucket.activeShowcases),
          ])}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Витрины по месяцам</h2>
        <ChartContainer config={SHOWCASE_CONFIG} className="aspect-[2/1] w-full max-w-3xl">
          <BarChart data={showcaseData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="newlyPublished" fill="var(--color-newlyPublished)" radius={4} />
            <Bar dataKey="activeShowcases" fill="var(--color-activeShowcases)" radius={4} />
          </BarChart>
        </ChartContainer>
        <Table
          head={["Месяц", "Опубликовано", "Активных витрин"]}
          rows={showcaseData.map((bucket) => [bucket.month, String(bucket.newlyPublished), String(bucket.activeShowcases)])}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Витрины по статусам сейчас</h2>
        <Table
          head={["Статус", "Витрин"]}
          rows={showcases.data.byStatus.map((entry) => [SHOWCASE_STATUS_LABELS[entry.status], String(entry.count)])}
        />
      </section>
    </div>
  )
}
