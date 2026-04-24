import { NextRequest, NextResponse } from "next/server";
import { parseSession, AUTH_COOKIE, safeEqual, generateToken, magicLinkExpiry } from "@/lib/auth";
import {
  getLeraar,
  getSchool,
  updateLeraar,
  deleteLeraar,
  createMagicLink,
} from "@/lib/authDb";
import { sendEmail, magicLinkEmail } from "@/lib/email";

async function resolveAdminContext(request: NextRequest) {
  const beheerToken = request.cookies.get("beheer_token");
  if (beheerToken && safeEqual(beheerToken.value, process.env.ADMIN_TOKEN)) {
    return { kind: "lescoach" as const };
  }
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session) return null;
  const leraar = await getLeraar(session.leraarId);
  if (!leraar || leraar.rol !== "admin" || leraar.status === "geblokkeerd") return null;
  return { kind: "school-admin" as const, leraar };
}

async function ensureScope(ctx: Awaited<ReturnType<typeof resolveAdminContext>>, targetId: string) {
  if (!ctx) return false;
  if (ctx.kind === "lescoach") return true;
  const target = await getLeraar(targetId);
  if (!target) return false;
  return target.schoolId === ctx.leraar.schoolId;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const ctx = await resolveAdminContext(request);
  if (!(await ensureScope(ctx, id))) return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });

  try {
    const patch = await request.json();
    const allowed: Record<string, unknown> = {};
    if (patch.naam !== undefined) allowed.naam = patch.naam;
    if (patch.rol !== undefined) allowed.rol = patch.rol;
    if (patch.status !== undefined) allowed.status = patch.status;
    const leraar = await updateLeraar(id, allowed);
    return NextResponse.json({ leraar });
  } catch (err) {
    console.error("[beheer/leraren/:id] PATCH:", err);
    return NextResponse.json({ error: "Kon leraar niet bijwerken" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const ctx = await resolveAdminContext(request);
  if (!(await ensureScope(ctx, id))) return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });

  try {
    await deleteLeraar(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[beheer/leraren/:id] DELETE:", err);
    return NextResponse.json({ error: "Kon leraar niet verwijderen" }, { status: 500 });
  }
}

// Nieuwe magic-link sturen (resend invite)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const ctx = await resolveAdminContext(request);
  if (!(await ensureScope(ctx, id))) return NextResponse.json({ error: "Niet toegestaan" }, { status: 403 });

  const leraar = await getLeraar(id);
  if (!leraar) return NextResponse.json({ error: "Niet gevonden" }, { status: 404 });

  const token = generateToken();
  const verlooptOp = magicLinkExpiry();
  await createMagicLink(token, leraar.id, verlooptOp);

  const appUrl = process.env.APP_URL || "https://lescoach.nl";
  const loginUrl = `${appUrl.replace(/\/$/, "")}/auth/verify?token=${encodeURIComponent(token)}`;
  const school = leraar.schoolId ? await getSchool(leraar.schoolId) : null;
  const { subject, html, text } = magicLinkEmail({
    naam: leraar.naam,
    loginUrl,
    schoolnaam: school?.schoolnaam,
    isFirstLogin: leraar.status === "uitgenodigd",
  });
  await sendEmail({ to: leraar.email, subject, html, text });

  return NextResponse.json({ success: true });
}
