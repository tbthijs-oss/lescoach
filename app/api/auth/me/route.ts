import { NextRequest, NextResponse } from "next/server";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";
import { getLeraar, getSchool } from "@/lib/authDb";

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

  return NextResponse.json({
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
}
