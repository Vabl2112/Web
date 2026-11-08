import Link from "next/link"
import { ModerationReview } from "@/components/admin/moderation-review"

export default async function ModerationReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <>
      <Link href="/admin/moderation" className="w-fit text-sm text-muted-foreground underline underline-offset-4">
        ← К очередям
      </Link>
      <ModerationReview creatorId={id} />
    </>
  )
}
