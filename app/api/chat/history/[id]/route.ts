import { NextRequest, NextResponse } from "next/server";
import { getGesprek } from "@/lib/gesprekkenDb";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";

/**
 * GET /api/chat/history/[id]
 * Retourneert één specifiek gesprek INCLUSIEF berichten.
 * Check: alleen als de leraar van het gesprek = de ingelogde leraar.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session || !session.leraarId || session.leraarId === "founder") {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  const gesprek = await getGesprek(id);
  if (!gesprek) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (gesprek.leraarId && gesprek.leraarId !== session.leraarId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return NextResponse.json({ gesprek });
}
