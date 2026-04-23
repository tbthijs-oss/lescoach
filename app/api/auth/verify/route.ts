import { NextRequest, NextResponse } from "next/server";
import {
  findMagicLink,
  markMagicLinkUsed,
  getLeraar,
  updateLeraar,
} from "@/lib/authDb";
import {
  magicLinkIsFresh,
  serializeSession,
  AUTH_COOKIE,
} from "@/lib/auth";

/**
 * GET /api/auth/verify?token=xxx
 *
 * Wordt aangeroepen vanuit /auth/verify page (server-side nadat de user
 * op de e-maillink klikt). Valideert het token, markeert het als
 * gebruikt, zet de sessie-cookie, en redirect naar /chat (of /beheer/scholen
 * voor admin-rol).
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const origin = request.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid", origin));
  }

  const link = await findMagicLink(token);
  if (!link) {
    return NextResponse.redirect(new URL("/login?error=invalid", origin));
  }
  if (link.gebruiktOp) {
    return NextResponse.redirect(new URL("/login?error=used", origin));
  }
  if (!magicLinkIsFresh(link.verlooptOp)) {
    return NextResponse.redirect(new URL("/login?error=expired", origin));
  }
  if (!link.leraarId) {
    return NextResponse.redirect(new URL("/login?error=invalid", origin));
  }

  const leraar = await getLeraar(link.leraarId);
  if (!leraar) {
    return NextResponse.redirect(new URL("/login?error=invalid", origin));
  }
  if (leraar.status === "geblokkeerd") {
    return NextResponse.redirect(new URL("/login?error=blocked", origin));
  }

  // Consume token (single-use)
  await markMagicLinkUsed(link.id);

  // Activeer leraar als dit hun eerste login is + log laatste login
  const nowIso = new Date().toISOString();
  const patch: { status?: "actief"; laatsteLogin?: string } = { laatsteLogin: nowIso };
  if (leraar.status === "uitgenodigd") patch.status = "actief";
  try {
    await updateLeraar(leraar.id, patch);
  } catch (err) {
    console.warn("[auth/verify] kon leraar niet bijwerken:", err);
  }

  // Sessie-cookie zetten
  const sessionValue = serializeSession({
    leraarId: leraar.id,
    issuedAt: Date.now(),
  });

  // Admin → /beheer/scholen of /school, leraar → /chat
  const redirectTo = leraar.rol === "admin" ? "/school" : "/chat";
  const response = NextResponse.redirect(new URL(redirectTo, origin));
  response.cookies.set(AUTH_COOKIE.name, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE.maxAge,
    path: "/",
  });
  return response;
}
