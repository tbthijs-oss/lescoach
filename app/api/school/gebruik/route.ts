import { NextRequest, NextResponse } from "next/server";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";
import { getLeraar, listLerarenForSchool } from "@/lib/authDb";
import { listGesprekkenForSchool } from "@/lib/gesprekkenDb";

/**
 * GET /api/school/gebruik?dagen=30
 *
 * Retourneert analytics voor de school van de ingelogde admin:
 *  - totaal aantal gesprekken in periode
 *  - gesprekken per week (laatste 12 weken)
 *  - top categorieën
 *  - aantal actieve leraren
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const leraar = await getLeraar(session.leraarId);
  if (!leraar || leraar.rol !== "admin" || !leraar.schoolId) {
    return NextResponse.json({ error: "Alleen toegankelijk voor school-admins" }, { status: 403 });
  }

  const dagenParam = Number(request.nextUrl.searchParams.get("dagen") || "30");
  const dagen = Math.max(7, Math.min(365, Number.isFinite(dagenParam) ? dagenParam : 30));
  const sinceIso = new Date(Date.now() - dagen * 24 * 60 * 60 * 1000).toISOString();

  let gesprekken: Awaited<ReturnType<typeof listGesprekkenForSchool>>;
  try {
    gesprekken = await listGesprekkenForSchool(leraar.schoolId, sinceIso);
  } catch (err) {
    console.warn("[school/gebruik] kon gesprekken niet ophalen:", err);
    gesprekken = [];
  }

  // Groepeer per week (ISO-week bucket — yyyy-ww)
  const perWeek = new Map<string, number>();
  const perCategorie = new Map<string, number>();
  const actieveLeraarIds = new Set<string>();

  for (const g of gesprekken) {
    const d = new Date(g.datum);
    if (Number.isNaN(d.getTime())) continue;
    const weekKey = isoWeekKey(d);
    perWeek.set(weekKey, (perWeek.get(weekKey) || 0) + 1);
    if (g.categorie) perCategorie.set(g.categorie, (perCategorie.get(g.categorie) || 0) + 1);
    if (g.leraarId) actieveLeraarIds.add(g.leraarId);
  }

  const perWeekSorted = Array.from(perWeek.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-12)
    .map(([week, count]) => ({ week, count }));

  const topCategorieen = Array.from(perCategorie.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([categorie, count]) => ({ categorie, count }));

  const totaal = gesprekken.length;

  // Totaal leraren op school (ter vergelijking met aantal actief)
  let totaalLeraren = 0;
  try {
    const leraren = await listLerarenForSchool(leraar.schoolId);
    totaalLeraren = leraren.length;
  } catch {
    totaalLeraren = 0;
  }

  return NextResponse.json({
    periodeInDagen: dagen,
    totaalGesprekken: totaal,
    actieveLeraren: actieveLeraarIds.size,
    totaalLeraren,
    perWeek: perWeekSorted,
    topCategorieen,
  });
}

function isoWeekKey(d: Date): string {
  // Thursday-based ISO week
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((+date - +yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}
