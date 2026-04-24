import { NextRequest, NextResponse } from "next/server";
import { listGesprekkenForLeraar } from "@/lib/gesprekkenDb";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";

/**
 * GET /api/chat/history
 * Retourneert de laatste 10 afgeronde gesprekken van de ingelogde leraar.
 * Zonder berichten (compact) — voor de lijst-weergave.
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session || !session.leraarId || session.leraarId === "founder") {
    // Founder (Thomas) heeft geen Airtable-leraar-id, dus geen historie.
    return NextResponse.json({ gesprekken: [] });
  }
  try {
    const gesprekken = await listGesprekkenForLeraar(session.leraarId, 10);
    // Strip berichten uit de lijst-response om payload klein te houden
    return NextResponse.json({
      gesprekken: gesprekken.map((g) => ({
        id: g.id,
        datum: g.datum,
        primaryKaart: g.primaryKaart,
        samenvatting: g.samenvatting,
        zoekterm: g.zoekterm,
        categorie: g.categorie,
      })),
    });
  } catch (err) {
    console.warn("[chat/history] list mislukt:", err);
    return NextResponse.json({ gesprekken: [] });
  }
}
