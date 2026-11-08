import { HomePage } from "@/components/home-page"

// The page reads the catalog on every request; it must not be built once without the backend.
export const dynamic = "force-dynamic"

export default HomePage
