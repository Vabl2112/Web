import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { EggImage } from "@/components/egg-image"
import { Button } from "@/components/ui/button"
import type { GalleryItem } from "@/lib/catalog"
import { cn } from "@/lib/utils"

/** The shape of every picture of the collage, as in the first front page: the left column starts with a tall one, the right with a square. */
const SHAPES = ["aspect-[3/4]", "aspect-square", "aspect-square", "aspect-[3/4]"]
/** Which work stands in which column: 0 and 2 on the left, 1 and 3 on the right, so the shapes alternate. */
const COLUMNS = [
  [0, 2],
  [1, 3],
]

function Collage({ works }: { works: GalleryItem[] }) {
  return (
    <div className="grid w-full max-w-lg grid-cols-2 gap-3 sm:gap-4 lg:justify-self-end">
      {COLUMNS.map((indexes, column) => (
        <div key={column} className={cn("flex flex-col gap-3 sm:gap-4", column === 1 && "mt-6 sm:mt-8")}>
          {indexes.map((index) => {
            const work = works[index]
            if (work === undefined) return null
            return (
              <Link
                key={work.id}
                href={`/creators/${work.creatorId}`}
                aria-label={`Витрина: ${work.author.displayName}`}
                className={cn("group relative block overflow-hidden rounded-2xl bg-muted", SHAPES[index])}
              >
                <EggImage
                  image={work.image}
                  alt=""
                  sizes="(min-width: 1024px) 25vw, 45vw"
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </Link>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * The opening block of the front page for a guest, as the first front page had it: a pill, the line "Найди своего мастера" with the
 * word of the brand colour, what EGG is, the two buttons, and a collage of works on the right. The collage is the newest works of the
 * gallery, so it is real and each picture leads to its showcase; without works there is no collage. The first front page also had four
 * big numbers (masters, works, clients, the rating) that were only drawn: there are none here until the API can give real ones.
 */
export function Hero({ works }: { works: GalleryItem[] }) {
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
      <div className="flex flex-col items-start gap-6">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">Платформа для творческих людей</span>
        <h1 id="hero-title" className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Найди своего <span className="block text-amber-500">мастера</span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
          EGG — маркетплейс, где творческие люди продают свои работы, услуги и товары ручной работы. Художники, керамисты, ювелиры,
          фотографы и другие мастера — все в одном месте.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="rounded-full px-6">
            <Link href="/creators">
              Найти мастера
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6">
            <Link href="/register">Начать продавать</Link>
          </Button>
        </div>
      </div>
      {works.length > 0 ? <Collage works={works} /> : null}
    </section>
  )
}
