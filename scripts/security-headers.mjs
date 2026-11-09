import { contentSecurityPolicy } from "./csp.mjs"

/**
 * The security headers of every page, next to the `Content-Security-Policy`: nothing may be sniffed or framed, the address of a page is
 * not sent to other sites in full, and the browser features that the site never uses stay off. `Strict-Transport-Security` is not here:
 * it belongs to the server that ends TLS (nginx), which knows that the site is served over https only.
 *
 * @param {{ mediaOrigin?: string, development?: boolean }} [options] the same as for {@link contentSecurityPolicy}
 * @returns {{ key: string, value: string }[]} the headers in the form that `headers()` of next.config.mjs wants
 */
export function securityHeaders(options = {}) {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  ]
}
