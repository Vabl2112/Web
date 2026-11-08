# Spikes

Short records of the questions the plan asked to check before building on an answer.

## S5 — body size limit of the Next proxy (not run yet)

**Question.** Uploads go from the browser to the API through `/api/v1/...`. In production nginx routes that prefix and Next never
sees the body. On the demo build (Vercel, or `pnpm dev`) `rewrites()` in `next.config.mjs` proxies it through Next, and Next cuts a
proxied body at 10 MB by default, while the contract accepts an image of up to 10 MB plus the multipart envelope.

**What is in place.** `experimental.proxyClientMaxBodySize: "12mb"` in `next.config.mjs`. The key exists in Next 16.2 (its config
schema), but nobody has sent a 10 MB file through the proxy yet.

**To run it.** Start the backend and `EGG_API_ORIGIN=http://localhost:8080 pnpm dev`, then `POST` a 10 MB JPEG to
`/api/v1/me/showcase/portfolio` (or any upload operation) with a valid session. Expected: `201`, not `413`. If Next answers `413`,
raise the value or document that uploads on the demo build are limited to the size that passes.

**Why it is not blocking.** The VM build never proxies through Next, so the limit only touches the demo.
