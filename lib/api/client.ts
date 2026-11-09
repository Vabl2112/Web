import createClient, { type Middleware } from "openapi-fetch"
import type { paths } from "./schema"

type Method = "get" | "put" | "post" | "delete" | "options" | "head" | "patch" | "trace"

// The contract declares `X-EGG-Client` as a required header of every non-GET operation, so the generated types would ask for it at
// each call. The middleware below sets it on every request, so the types of this client leave it out; any other required header stays.
type HeaderWithoutClient<P> = P extends { header: infer H }
  ? [keyof Omit<H, "X-EGG-Client">] extends [never]
    ? unknown
    : { header: Omit<H, "X-EGG-Client"> }
  : unknown

type WithoutClientHeader<Op> = Op extends { parameters: infer P }
  ? Omit<Op, "parameters"> & { parameters: Omit<P, "header"> & HeaderWithoutClient<P> }
  : Op

type ApiPaths = {
  [Path in keyof paths]: { [M in keyof paths[Path]]: M extends Method ? WithoutClientHeader<paths[Path][M]> : paths[Path][M] }
}

/** What the page must do about an answer of the API. */
export type Reaction = "none" | "guest" | "login" | "offer-login" | "upgrade"

/** The pages that need a signed-in user; on the other pages a `401` only offers to sign in. */
const PROTECTED_PREFIXES = ["/cabinet", "/messages", "/admin"]

export function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

/**
 * The rules of the plan (P5.1): `426` asks the person to reload the page; a `401` to `GET /v1/me` means "guest" and changes
 * nothing; any other `401` sends the person to the login page when the page is one that needs a session, and only offers to sign
 * in on a public page. There is no refresh of tokens (D2).
 */
export function reactionTo(status: number, request: { method: string; path: string }, pathname: string): Reaction {
  if (status === 426) return "upgrade"
  if (status !== 401) return "none"
  // A `401` of the login is the answer "wrong e-mail or password" and one of the logout says there is no session to end: the forms
  // show those themselves, the page must not offer to sign in or move away.
  if (request.path === "/v1/auth/login" || request.path === "/v1/auth/logout") return "none"
  if (request.method.toUpperCase() === "GET" && request.path === "/v1/me") return "guest"
  return isProtectedPage(pathname) ? "login" : "offer-login"
}

/** A stand-in for the address of this site: only to see whether a path stays on it. */
const THIS_SITE = "http://this-site.invalid"

/** The address the person comes back to after signing in: a path of this site, never another site. */
export function returnToOf(pathname: string, search = ""): string {
  const value = `${pathname}${search}`
  // `//host` and `/\host` both mean another site to a browser, and so does `/` + tab + `/host`: the URL parser of a browser drops tabs and
  // line breaks, which leaves `//host`. Control characters and backslashes are refused outright; what is left is resolved the way a
  // browser does it, and only a path of this site (never another origin) is given back.
  if (!value.startsWith("/") || /[\u0000-\u001f\u007f\\]/.test(value)) return "/"
  const resolved = new URL(value, THIS_SITE)
  return resolved.origin === THIS_SITE ? `${resolved.pathname}${resolved.search}` : "/"
}

export interface ClientHooks {
  /** The page needs a session: send the person to the login page. */
  onLogin(returnTo: string): void
  /** A public page was refused for a missing session: offer to sign in. */
  onOfferLogin(): void
  /** The build of the page is older than the backend accepts. */
  onUpgrade(): void
}

export interface ClientOptions {
  baseUrl: string
  /** The build number `N` of `X-EGG-Client: web/<N>`. */
  version: string
  hooks: ClientHooks
  /** The path of the page that makes the call (the window location in a browser). */
  currentPath(): { pathname: string; search: string }
  fetch?: typeof fetch
}

/** The client of the API: the generated types, `X-EGG-Client` on every request and the rules for `401` and `426`. */
export function createApiClient(options: ClientOptions) {
  const client = createClient<ApiPaths>({ baseUrl: options.baseUrl, fetch: options.fetch })
  const middleware: Middleware = {
    onRequest({ request }) {
      request.headers.set("X-EGG-Client", `web/${options.version}`)
      return request
    },
    onResponse({ request, response }) {
      const path = new URL(request.url, "http://localhost").pathname.replace(/^\/api/, "")
      const here = options.currentPath()
      switch (reactionTo(response.status, { method: request.method, path }, here.pathname)) {
        case "upgrade":
          options.hooks.onUpgrade()
          break
        case "login":
          options.hooks.onLogin(returnToOf(here.pathname, here.search))
          break
        case "offer-login":
          options.hooks.onOfferLogin()
          break
        default:
          break
      }
      return undefined
    },
  }
  client.use(middleware)
  return client
}

export const UPGRADE_EVENT = "egg:upgrade-required"
export const OFFER_LOGIN_EVENT = "egg:offer-login"

const browserHooks: ClientHooks = {
  onLogin: (returnTo) => window.location.assign(`/login?returnTo=${encodeURIComponent(returnTo)}`),
  onOfferLogin: () => window.dispatchEvent(new Event(OFFER_LOGIN_EVENT)),
  onUpgrade: () => window.dispatchEvent(new Event(UPGRADE_EVENT)),
}

const serverHooks: ClientHooks = { onLogin: () => {}, onOfferLogin: () => {}, onUpgrade: () => {} }

/** The base address: the backend itself on the server (never with the cookie of the user), `/api` in a browser (the web server proxies it). */
export function baseUrl(): string {
  return typeof window === "undefined" ? (process.env.EGG_API_INTERNAL_URL ?? "http://localhost:8080") : "/api"
}

/** The client for the current environment: in a browser it reacts to `401` and `426`, on the server it only calls. */
export const api = createApiClient({
  baseUrl: baseUrl(),
  version: process.env.NEXT_PUBLIC_EGG_WEB_VERSION ?? "0",
  hooks: typeof window === "undefined" ? serverHooks : browserHooks,
  currentPath: () =>
    typeof window === "undefined" ? { pathname: "/", search: "" } : { pathname: window.location.pathname, search: window.location.search },
})
