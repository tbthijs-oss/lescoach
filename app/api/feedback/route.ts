import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const rating = body?.rating;
    if (rating !== "up" && rating !== "down") {
      return NextResponse.json({ error: "Ongeldig rating-veld." }, { status: 400 });
    }
    // Structured log — Vercel picks this up for monitoring.
    console.log(JSON.stringify({ level: "info", scope: "feedback", rating, ts: new Date().toISOString() }));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // silent fail — never block the user
  }
}
