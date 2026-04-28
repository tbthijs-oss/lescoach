import { NextRequest, NextResponse } from "next/server";
import { parseSession, serializeSession, AUTH_COOKIE, MODE_COOKIE } from "@/lib/auth";
import { getLeraar, getSchool } from "@/lib/authDb";

// Sliding-refresh: vernieuw de hoofdcookie als hij ouder is dan 24 uur.
// Zo blijft een actieve gebruiker eindeloos ingelogd, zonder elke request
// een Set-Cookie header te hoeven sturen.
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/auth/me
 * Geeft info over de huidige sessie terug, of 401 bij geen sessie.
 * Gebruikt door de chat-pagina om naam + school op te halen.
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const leraar = await getLeraar(session.leraarId);
  if (!leraar || leraar.status === "geblokkeerd") {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const school = leraar.schoolId ? await getSchool(leraar.schoolId) : null;

  const response = NextResponse.json({
    authenticated: true,
    leraar: {
      id: leraar.id,
      email: leraar.email,
      naam: leraar.naam,
      rol: leraar.rol,
      status: leraar.status,
    },
    school: school
      ? {
          id: school.id,
          schoolnaam: school.schoolnaam,
          status: school.status,
        }
      : null,
  });

  // Sliding session: alleen als de gebruiker "blijf ingelogd" had aangevinkt
  // én de huidige cookie ouder is dan REFRESH_AFTER_MS. Voorkomt dat we elke
  // poll een nieuwe cookie sturen, en zorgt dat een actieve gebruiker nooit
  // automatisch wordt uitgelogd.
  const modeCookie = request.cookies.get(MODE_COOKIE.name);
  const isPersistent = modeCookie?.value === MODE_COOKIE.persistentValue;
  if (isPersistent && Date.now() - session.issuedAt > REFRESH_AFTER_MS) {
    const refreshed = serializeSession({ leraarId: session.leraarId, issuedAt: Date.now() });
    response.cookies.set(AUTH_COOKIE.name, refreshed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_COOKIE.maxAge,
    });
    // Refresh ook de mode-cookie zodat hij niet vóór de sessie verloopt.
    response.cookies.set(MODE_COOKIE.name, MODE_COOKIE.persistentValue, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MODE_COOKIE.maxAge,
    });
  }

  return response;
}
