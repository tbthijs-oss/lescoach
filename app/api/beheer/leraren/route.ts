import { NextRequest, NextResponse } from "next/server";
import { parseSession, AUTH_COOKIE, safeEqual, generateToken, magicLinkExpiry } from "@/lib/auth";
import {
  getLeraar,
  getSchool,
  listLerarenForSchool,
  createLeraar,
  createMagicLink,
  findLeraarByEmail,
} from "@/lib/authDb";
import { sendEmail, magicLinkEmail } from "@/lib/email";

/**
 * API voor school-admins: leraren-lijst ophalen voor jouw school, en
 * nieuwe leraren uitnodigen. Authorizatie: óf beheer_token (Thomas),
 * óf leraren-sessie met rol=admin.
 */

async function resolveAdminContext(request: NextRequest) {
  // Thomas (LesCoach-admin)
  const beheerToken = request.cookies.get("beheer_token");
  if (beheerToken && safeEqual(beheerToken.value, process.env.ADMIN_TOKEN)) {
    return { kind: "lescoach" as const };
  }
  // School-admin (leraar met rol admin)
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session) return null;
  const leraar = await getLeraar(session.leraarId);
  if (!leraar || leraar.rol !== "admin" || leraar.status === "geblokkeerd") return null;
  return { kind: "school-admin" as const, leraar };
}

export async function GET(request: NextRequest) {
  const ctx = await resolveAdminContext(request);
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const schoolId = request.nextUrl.searchParams.get("schoolId");

  // Bepaal scope: LesCoach admin kan elke school; school-admin alleen eigen school.
  let targetSchoolId: string | null = null;
  if (ctx.kind === "lescoach") {
    targetSchoolId = schoolId;
  } else {
    targetSchoolId = ctx.leraar.schoolId;
  }
  if (!targetSchoolId) return NextResponse.json({ leraren: [] });

  const leraren = await listLerarenForSchool(targetSchoolId);
  return NextResponse.json({ leraren });
}

export async function POST(request: NextRequest) {
  const ctx = await resolveAdminContext(request);
  if (!ctx) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  try {
    const body = await request.json();
    const { email, naam, rol = "leraar", schoolId: schoolIdFromBody } = body || {};
    if (!email || !naam) {
      return NextResponse.json({ error: "Naam en email zijn verplicht." }, { status: 400 });
    }

    const targetSchoolId = ctx.kind === "lescoach" ? schoolIdFromBody : ctx.leraar.schoolId;
    if (!targetSchoolId) {
      return NextResponse.json({ error: "School onbekend." }, { status: 400 });
    }

    // Duplicaat-check
    const existing = await findLeraarByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: `Er bestaat al een account voor ${email}.` },
        { status: 409 }
      );
    }

    const uitgenodigdDoor =
      ctx.kind === "lescoach" ? "LesCoach" : `${ctx.leraar.naam} (${ctx.leraar.email})`;

    const leraar = await createLeraar({
      email,
      naam,
      schoolId: targetSchoolId,
      rol,
      uitgenodigdDoor,
    });

    // Direct magic-link sturen
    const token = generateToken();
    const verlooptOp = magicLinkExpiry();
    await createMagicLink(token, leraar.id, verlooptOp);

    const appUrl = process.env.APP_URL || "https://lescoach.nl";
    const loginUrl = `${appUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}`;
    const school = await getSchool(targetSchoolId);
    const { subject, html, text } = magicLinkEmail({
      naam: leraar.naam,
      loginUrl,
      schoolnaam: school?.schoolnaam,
      isFirstLogin: true,
    });
    await sendEmail({ to: leraar.email, subject, html, text });

    return NextResponse.json({ leraar });
  } catch (err) {
    console.error("[beheer/leraren] POST:", err);
    return NextResponse.json({ error: "Kon leraar niet uitnodigen" }, { status: 500 });
  }
}
