import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /beheer routes (except login page and auth API)
  if (
    pathname.startsWith("/beheer") &&
    pathname !== "/beheer/login" &&
    !pathname.startsWith("/api/beheer/auth")
  ) {
    const token = request.cookies.get("beheer_token");
    if (!token || token.value !== process.env.ADMIN_TOKEN) {
      const loginUrl = new URL("/beheer/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/beheer/:path*", "/api/beheer/:path*"],
};
