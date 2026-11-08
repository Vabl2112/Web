import { NextResponse, type NextRequest } from "next/server"

/** The cookie that says "a session exists": it has no secret, the token is another cookie that only the API sees (AC-40 (а)). */
export const SESSION_MARKER_COOKIE = "egg_session"

/**
 * Sends a guest from the pages that need a session to the login page, back to where they were going. It only looks for the marker
 * cookie: it does not read the token and does not know the roles, so the API alone decides who may do what (a page that the API
 * refuses with `403` shows "no access").
 */
export function proxy(request: NextRequest) {
  if (request.cookies.get(SESSION_MARKER_COOKIE)?.value) return NextResponse.next()
  const login = request.nextUrl.clone()
  login.pathname = "/login"
  login.search = `?returnTo=${encodeURIComponent(`${request.nextUrl.pathname}${request.nextUrl.search}`)}`
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ["/cabinet/:path*", "/messages/:path*", "/admin/:path*"],
}
