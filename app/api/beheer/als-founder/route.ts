import { NextRequest, NextResponse } from "next/server";
import { serializeSession, AUTH_COOKIE } from "@/lib/auth";

/**
 * Founder shortcut: als de beheerder is ingelogd (beheer_token cookie matcht
 * ADMIN_TOKEN), zetten we een geldige leraar-sessiecookie zodat Thomas direct
 * in /chat kan zonder een magic-link te ontvangen.
 *
 * De leraarId is een synthetische identiteit ("founder") — geen Airtable-record.
 * /api/chat tolereert een ontbrekende leraar (try/catch rond getLeraar), dus de
 * chat werkt met de default system prompt.
 */
export async function POST(request: NextRequest) {
  const token = request.cookies.get("beheer_token")?.value;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Niet geautoriseerd" }, { status: 401 });
  }

  const sessionValue = serializeSession({
    leraarId: "founder",
    issuedAt: Date.now(),
  });

  const response = NextResponse.json({ ok: true, redirect: "/chat" });
  response.cookies.set(AUTH_COOKIE.name, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE.maxAge,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get("beheer_token")?.value;
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.redirect(new URL("/beheer/login", request.url));
  }

  const sessionValue = serializeSession({
    leraarId: "founder",
    issuedAt: Date.now(),
  });

  const response = NextResponse.redirect(new URL("/chat", request.url));
  response.cookies.set(AUTH_COOKIE.name, sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_COOKIE.maxAge,
    path: "/",
  });
  return response;
}
