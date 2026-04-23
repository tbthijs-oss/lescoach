import { NextRequest, NextResponse } from "next/server";
import { parseExpertSession, EXPERT_COOKIE } from "@/lib/expertAuth";
import { getExpert, updateExpertProfile } from "@/lib/expertsDb";

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(EXPERT_COOKIE.name);
  const session = parseExpertSession(cookie?.value);
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  const expert = await getExpert(session.expertId);
  if (!expert) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, expert });
}

export async function PATCH(request: NextRequest) {
  const cookie = request.cookies.get(EXPERT_COOKIE.name);
  const session = parseExpertSession(cookie?.value);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const allowed = [
    "naam", "titel", "bio", "specialisaties", "telefoon", "linkedin",
    "fotoUrl", "beschikbaar", "ervaringsjaren", "regio", "taal",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }
  try {
    const expert = await updateExpertProfile(session.expertId, patch);
    return NextResponse.json({ expert });
  } catch (err) {
    console.error("[expert/profiel PATCH] error:", err);
    return NextResponse.json({ error: "Update mislukt" }, { status: 500 });
  }
}
