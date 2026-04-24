import { NextRequest, NextResponse } from "next/server";
import { listMeldcodeSignalen } from "@/lib/meldcodeDb";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";
import { getLeraar } from "@/lib/authDb";

/**
 * GET /api/school/meldcode
 * Lijst meldcode-signalen voor de school van de ingelogde admin.
 * Alleen rol=admin mag deze data zien (aandachtsfunctionaris-vereisten).
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session || !session.leraarId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  // Founder-shortcut: Thomas mag alles zien
  if (session.leraarId === "founder") {
    const alle = await listMeldcodeSignalen();
    return NextResponse.json({ signalen: alle });
  }
  const leraar = await getLeraar(session.leraarId);
  if (!leraar || leraar.rol !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!leraar.schoolId) {
    return NextResponse.json({ signalen: [] });
  }
  const signalen = await listMeldcodeSignalen(leraar.schoolId);
  return NextResponse.json({ signalen });
}
