import { CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

/** The mark that an administrator sets on a showcase (AC-48). It is only drawn for a showcase whose `verified` the API sent as true. */
export function VerifiedBadge() {
  return (
    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700">
      <CheckCircle aria-hidden className="size-3" />
      Проверен
    </Badge>
  )
}
