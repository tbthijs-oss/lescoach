import { NextResponse } from "next/server";
import { AUTH_COOKIE, MODE_COOKIE } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Verwijdert de sessie-cookie en de bijbehorende "blijf ingelogd"-marker.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  const opts = {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set(AUTH_COOKIE.name, "", { ...opts, httpOnly: true });
  response.cookies.set(MODE_COOKIE.name, "", { ...opts, httpOnly: false });
  return response;
}
