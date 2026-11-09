import { computeBuildVersion } from "./scripts/build-version.mjs"
import { securityHeaders } from "./scripts/security-headers.mjs"

// Set for `pnpm dev` and for a build that has no web server in front of it (the demo on Vercel): `/api/v1/...` goes to the backend.
// Behind nginx (the image for the VM) it is not set: nginx routes `/api/v1/` itself.
const apiOrigin = process.env.EGG_API_ORIGIN

const headers = securityHeaders({
  mediaOrigin: process.env.EGG_MEDIA_ORIGIN,
  development: process.env.NODE_ENV !== "production",
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The build number sent as `X-EGG-Client: web/<N>`; a build without git history fails here on purpose.
  env: {
    NEXT_PUBLIC_EGG_WEB_VERSION: String(computeBuildVersion()),
  },
  images: {
    unoptimized: true,
  },
  output: "standalone",
  experimental: {
    // An upload may be 10 MB and the proxy of Next cuts a body at 10 MB by default (spike S5: 9.9 MB passes, 10.5 MB gets 413).
    proxyClientMaxBodySize: "12mb",
  },
  async rewrites() {
    return apiOrigin ? [{ source: "/api/v1/:path*", destination: `${apiOrigin}/v1/:path*` }] : []
  },
  // The routes of the first mock of the site lead to their successors, so old links keep working.
  async redirects() {
    return [
      { source: "/masters", destination: "/creators", permanent: true },
      { source: "/artist/:id", destination: "/creators/:id", permanent: true },
      { source: "/services", destination: "/listings?type=SERVICE", permanent: true },
      { source: "/products", destination: "/listings?type=READY_PRODUCT", permanent: true },
    ]
  },
  async headers() {
    return [{ source: "/:path*", headers }]
  },
}

export default nextConfig
