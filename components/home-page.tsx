import Link from "next/link"
import { Chip } from "@/components/catalog/filters"
import { CreatorCard } from "@/components/catalog/creator-card"
import { MasonryGrid } from "@/components/catalog/masonry-grid"
import { PageShell } from "@/components/catalog/page-shell"
import { unwrap } from "@/lib/api/answers"
import { serverApi } from "@/lib/api/server"
import { catalogHref } from "@/lib/catalog"

const PREVIEW_SIZE = 8

function SectionTitle({ title, href, linkText }: { title: string; href: string; linkText: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <Link href={href} className="text-sm text-muted-foreground underline underline-offset-4">
        {linkText}
      </Link>
    </div>
  )
}

/** The front page: the categories, the newest showcases and a preview of the feed of works, all read on the server. */
export async function HomePage() {
  const [categories, creators, gallery] = await Promise.all([
    unwrap(serverApi.GET("/v1/categories")),
    unwrap(serverApi.GET("/v1/creators", { params: { query: { limit: PREVIEW_SIZE } } })),
    unwrap(serverApi.GET("/v1/gallery", { params: { query: { limit: PREVIEW_SIZE } } })),
  ])
  return (
    <PageShell title="Витрины творческих людей" description="Находите создателей, смотрите их работы и пишите им напрямую.">
      <nav aria-label="Категории" className="flex flex-wrap gap-2">
        {categories.items.map((category) => (
          <Chip key={category.id} href={catalogHref("/creators", { categoryId: category.id })} active={false}>
            {category.name}
          </Chip>
        ))}
      </nav>
      {creators.items.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionTitle title="Новые витрины" href="/creators" linkText="Все создатели" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {creators.items.map((creator) => (
              <li key={creator.id}>
                <CreatorCard creator={creator} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {gallery.items.length > 0 ? (
        <section className="flex flex-col gap-4">
          <SectionTitle title="Работы" href="/gallery" linkText="Вся галерея" />
          <MasonryGrid
            tiles={gallery.items.map((item) => ({ id: item.id, image: item.image, title: item.title, href: `/creators/${item.creatorId}` }))}
          />
        </section>
      ) : null}
    </PageShell>
  )
}
