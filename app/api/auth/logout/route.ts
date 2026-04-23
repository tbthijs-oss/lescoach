import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";

/**
 * POST /api/auth/logout
 * Verwijdert de sessie-cookie.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE.name, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
