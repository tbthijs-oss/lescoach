import { NextRequest, NextResponse } from "next/server";
import { safeEqual } from "@/lib/safeEqual";

/**
 * Middleware: shallow cookie-presence check. Echte HMAC-validatie doen
 * de server components / API routes zelf (zodat we Node-crypto kunnen
 * gebruiken). Middleware draait op Edge en hoeft alleen "er is een
 * cookie" te checken voor een snelle redirect naar /login.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Beheer routes (admin-only, gebruikt ADMIN_TOKEN, los van leraren-auth)
  if (
    pathname.startsWith("/beheer") &&
    pathname !== "/beheer/login" &&
    !pathname.startsWith("/api/beheer/auth")
  ) {
    const token = request.cookies.get("beheer_token");
    if (!token || !safeEqual(token.value, process.env.ADMIN_TOKEN)) {
      const loginUrl = new URL("/beheer/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Leraar-auth routes (/chat, /resultaten, /school, /api/chat, /api/contact-expert, /api/school)
  const requiresLeraarAuth =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/resultaten") ||
    pathname.startsWith("/school") ||
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/contact-expert") ||
    pathname.startsWith("/api/school");

  if (requiresLeraarAuth) {
    const session = request.cookies.get("lescoach-leraar");
    const hasSession = session?.value && session.value.split("|").length === 3;
    if (!hasSession) {
      // Voor API-calls: 401. Voor page-navigaties: redirect naar /login.
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      if (pathname !== "/chat") loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Expert-auth routes (/expert/profiel, /api/expert/profiel)
  // De /expert/login en /expert/verify zijn publiek.
  const requiresExpertAuth =
    pathname.startsWith("/expert/profiel") ||
    pathname === "/api/expert/profiel" ||
    pathname.startsWith("/api/expert/profiel/");

  if (requiresExpertAuth) {
    const session = request.cookies.get("lescoach-expert");
    const hasSession = session?.value && session.value.split("|").length === 3;
    if (!hasSession) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/expert/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/beheer/:path*",
    "/api/beheer/:path*",
    "/chat/:path*",
    "/resultaten",
    "/resultaten/:path*",
    "/school/:path*",
    "/api/chat/:path*",
    "/api/contact-expert/:path*",
    "/api/school/:path*",
    "/expert/profiel",
    "/expert/profiel/:path*",
    "/api/expert/profiel",
    "/api/expert/profiel/:path*",
  ],
};
