import Link from "next/link"
import { ArrowRight, BadgeCheck, ImageIcon, Star, Users } from "lucide-react"
import { EggImage } from "@/components/egg-image"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { initialsOf } from "@/lib/auth/initials"
import type { CreatorSummary, GalleryItem } from "@/lib/catalog"
import { formatAverage, feedbackCountText } from "@/lib/format"
import { cn } from "@/lib/utils"

/** How many works stand in the collage of the opening block (two columns of two) and in the preview of the gallery (a row of six). */
export const COLLAGE_SIZE = 4
export const PREVIEW_SIZE = 6

/** The shape of each picture of the collage: the left column starts with a tall one, the right one with a square. */
const COLLAGE = [
  { indexes: [0, 2], shapes: ["aspect-[3/4]", "aspect-square"], className: "space-y-4" },
  { indexes: [1, 3], shapes: ["aspect-square", "aspect-[3/4]"], className: "space-y-4 pt-8" },
]

/** What the first front page said about EGG; the claims that were not true of the platform (safe deals, thousands of works) are reworded. */
const FEATURES = [
  { icon: Users, title: "Талантливые мастера", description: "Художники, ремесленники и мастера со всей страны в одном месте" },
  { icon: ImageIcon, title: "Уникальные работы", description: "Работы ручной работы: от картин до мебели и украшений" },
  { icon: Star, title: "Честные отзывы", description: "Отзыв может оставить только тот, кто уже переписывался с мастером" },
  { icon: BadgeCheck, title: "Проверенные мастера", description: "Витрины проходят модерацию, а отметку «Проверен» ставит команда EGG" },
]

interface LandingProps {
  /** The newest works of the gallery: the collage takes the first ones, the preview of the gallery the next ones. */
  works: GalleryItem[]
  /** The best rated showcases. */
  creators: CreatorSummary[]
}

function Collage({ works }: { works: GalleryItem[] }) {
  return (
    <div className="relative hidden lg:block">
      <div className="grid grid-cols-2 gap-4">
        {COLLAGE.map((column, n) => (
          <div key={n} className={column.className}>
            {column.indexes.map((index, row) => {
              const work = works[index]
              if (work === undefined) return null
              return (
                <Link
                  key={work.id}
                  href={`/creators/${work.creatorId}`}
                  aria-label={`Витрина: ${work.author.displayName}`}
                  className={cn("relative block overflow-hidden rounded-2xl bg-muted", column.shapes[row])}
                >
                  <EggImage image={work.image} alt="" sizes="(min-width: 1280px) 300px, 25vw" loading="eager" className="size-full object-cover" />
                </Link>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function Hero({ works }: { works: GalleryItem[] }) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-amber-50/50 to-background py-16 sm:py-24 dark:from-amber-950/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col items-start">
            <Badge variant="secondary" className="mb-4 rounded-full px-4 py-1">
              Платформа для творческих людей
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Найди своего <span className="text-amber-500">мастера</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-pretty text-muted-foreground">
              EGG — маркетплейс, где творческие люди продают свои работы, услуги и товары ручной работы. Художники, керамисты, ювелиры, фотографы
              и другие мастера — все в одном месте.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg" className="gap-2 rounded-full px-8">
                <Link href="/creators">
                  Найти мастера
                  <ArrowRight aria-hidden className="size-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                <Link href="/register">Начать продавать</Link>
              </Button>
            </div>
          </div>
          {works.length > 0 ? <Collage works={works} /> : null}
        </div>
      </div>
    </section>
  )
}

function Features() {
  return (
    <section className="border-b border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Почему выбирают EGG</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Платформа, которая объединяет творческих людей и ценителей ручной работы</p>
        </div>
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex flex-col items-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10">
                <feature.icon aria-hidden className="size-7 text-amber-500" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** The section heading with the button to the whole list (under the cards on a phone). */
function SectionHead({ title, description, href, link }: { title: string; description: string; href: string; link: string }) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h2 className="text-3xl font-bold sm:text-4xl">{title}</h2>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <Button asChild variant="outline" className="hidden gap-2 sm:flex">
        <Link href={href}>
          {link}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Button>
    </div>
  )
}

function SectionFoot({ href, link }: { href: string; link: string }) {
  return (
    <div className="mt-8 text-center sm:hidden">
      <Button asChild variant="outline" className="gap-2">
        <Link href={href}>
          {link}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Button>
    </div>
  )
}

function MasterTile({ creator, cover }: { creator: CreatorSummary; cover?: GalleryItem }) {
  const picture = cover?.image ?? creator.avatar
  return (
    <Link
      href={`/creators/${creator.id}`}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {picture ? (
          <EggImage
            image={picture}
            alt=""
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-6">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 ring-2 ring-white">
              {creator.avatar ? (
                <EggImage image={creator.avatar} alt="" sizes="48px" className="size-full object-cover" />
              ) : (
                <AvatarFallback>{initialsOf(creator.displayName)}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{creator.displayName}</p>
              <p className="truncate text-sm text-white/70">{creator.category.name}</p>
            </div>
          </div>
          {creator.rating ? (
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star aria-hidden className="size-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-white">{formatAverage(creator.rating.average)}</span>
              </div>
              <span className="text-sm text-white/70">{feedbackCountText(creator.rating.count)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

function BestMasters({ creators, works }: { creators: CreatorSummary[]; works: GalleryItem[] }) {
  return (
    <section className="border-b border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead title="Лучшие мастера" description="Топ мастеров по отзывам клиентов" href="/creators" link="Все мастера" />
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((creator) => (
            <MasterTile key={creator.id} creator={creator} cover={works.find((work) => work.creatorId === creator.id)} />
          ))}
        </div>
        <SectionFoot href="/creators" link="Все мастера" />
      </div>
    </section>
  )
}

function GalleryPreview({ works }: { works: GalleryItem[] }) {
  return (
    <section className="border-b border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHead title="Галерея работ" description="Вдохновляйтесь работами наших мастеров" href="/gallery" link="Вся галерея" />
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {works.map((work) => (
            <Link
              key={work.id}
              href={`/creators/${work.creatorId}`}
              aria-label={`Работа: ${work.author.displayName}`}
              className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
            >
              <EggImage
                image={work.image}
                alt=""
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                className="size-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            </Link>
          ))}
        </div>
        <SectionFoot href="/gallery" link="Вся галерея" />
      </div>
    </section>
  )
}

function Invitation() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-foreground px-6 py-16 text-center text-background sm:px-12">
          <h2 className="text-3xl font-bold sm:text-4xl">Присоединяйтесь к EGG</h2>
          <p className="mx-auto mt-4 max-w-xl text-background/70">
            Зарегистрируйтесь и откройте для себя мир творчества: находите уникальные работы, договаривайтесь с мастерами об услугах или начните
            показывать свои изделия.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="gap-2 rounded-full px-8">
              <Link href="/register">
                Создать аккаунт
                <ArrowRight aria-hidden className="size-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-background/20 bg-transparent px-8 text-background hover:bg-background/10 hover:text-background"
            >
              <Link href="/login">Уже есть аккаунт</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

/** The works of the preview of the gallery: the ones after the collage, or the first ones while there are too few for both. */
export function previewOf(works: GalleryItem[]): GalleryItem[] {
  const after = works.slice(COLLAGE_SIZE, COLLAGE_SIZE + PREVIEW_SIZE)
  return after.length === PREVIEW_SIZE ? after : works.slice(0, PREVIEW_SIZE)
}

/**
 * The front page for a guest, as the first front page had it: the opening block with the collage, why EGG, the best masters, the
 * gallery, the invitation to join and the footer. Every picture and master is real; a section with nothing to show is left out. The four
 * big numbers of the first page (masters, works, clients, rating) were only drawn, so they are not here.
 */
export function Landing({ works, creators }: LandingProps) {
  const preview = previewOf(works)
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero works={works.slice(0, COLLAGE_SIZE)} />
        <Features />
        {creators.length > 0 ? <BestMasters creators={creators} works={works} /> : null}
        {preview.length > 0 ? <GalleryPreview works={preview} /> : null}
        <Invitation />
      </main>
      <Footer />
    </div>
  )
}
