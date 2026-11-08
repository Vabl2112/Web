import { Badge } from "@/components/ui/badge"
import { REVIEW_STATUS_LABELS, type ReviewStatus, SHOWCASE_STATUS_LABELS, type ShowcaseStatus } from "@/lib/cabinet"

const SHOWCASE_VARIANTS = {
  DRAFT: "secondary",
  PENDING_REVIEW: "outline",
  PUBLISHED: "default",
  REJECTED: "destructive",
  WITHDRAWN: "secondary",
} as const satisfies Record<ShowcaseStatus, string>

const REVIEW_VARIANTS = { APPROVED: "secondary", PENDING: "outline", REJECTED: "destructive" } as const satisfies Record<ReviewStatus, string>

export function ShowcaseStatusBadge({ status }: { status: ShowcaseStatus }) {
  return <Badge variant={SHOWCASE_VARIANTS[status]}>{SHOWCASE_STATUS_LABELS[status]}</Badge>
}

/** The state of one piece of content (a photo, a work, a listing): what the public sees is the approved version only. */
export function ReviewBadge({ status }: { status: ReviewStatus }) {
  return <Badge variant={REVIEW_VARIANTS[status]}>{REVIEW_STATUS_LABELS[status]}</Badge>
}
