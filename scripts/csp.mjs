/**
 * The `Content-Security-Policy` of every page (P5.1). The images of the API come from the media address, so that origin is the only
 * one besides this site that may supply images (`EGG_MEDIA_ORIGIN`, AC-44). Next puts small inline scripts into every page to start
 * the app, so scripts may be inline; nothing else may be, and nothing may be framed, embedded or sent as a form to another site.
 * In development React Refresh needs `eval`.
 *
 * @param {{ mediaOrigin?: string, development?: boolean }} [options] `mediaOrigin` is an address such as `https://media.example.org`
 *   (a path or a trailing slash is dropped); a value that is not an address stops the build.
 */
export function contentSecurityPolicy({ mediaOrigin = "", development = false } = {}) {
  const media = mediaOrigin.trim() === "" ? [] : [new URL(mediaOrigin.trim()).origin]
  return [
    "default-src 'self'",
    `script-src ${["'self'", "'unsafe-inline'", ...(development ? ["'unsafe-eval'"] : [])].join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${["'self'", "data:", ...media].join(" ")}`,
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ")
}
