import { computeBuildVersion } from "./scripts/build-version.mjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The build number sent as `X-EGG-Client: web/<N>`; a build without git history fails here on purpose.
  env: {
    NEXT_PUBLIC_EGG_WEB_VERSION: String(computeBuildVersion()),
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
