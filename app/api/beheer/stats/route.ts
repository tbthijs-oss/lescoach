import { NextResponse } from "next/server";
import { listScholen, listLerarenForSchool } from "@/lib/authDb";
import { listMeldcodeSignalen } from "@/lib/meldcodeDb";
import { getAllKenniskaarten, EXPERTS_TABLE_ID } from "@/lib/airtable";

/**
 * Aggregate stats voor de beheer-Dashboard en sidebar-badges.
 * Fail-soft: elk onderdeel mag stil falen, we serveren altijd een object.
 */
export async function GET() {
  const result: {
    scholen: { total: number; actief: number; proef: number; inactief: number };
    leraren: { total: number };
    experts: { total: number; beschikbaar: number };
    kenniskaarten: { total: number; byCategorie: Record<string, number> };
    gesprekken: { total: number; last24h: number; last7d: number; byCategorie: Record<string, number> };
    meldcode: { total: number; nieuw: number; recent: number };
  } = {
    scholen: { total: 0, actief: 0, proef: 0, inactief: 0 },
    leraren: { total: 0 },
    experts: { total: 0, beschikbaar: 0 },
    kenniskaarten: { total: 0, byCategorie: {} },
    gesprekken: { total: 0, last24h: 0, last7d: 0, byCategorie: {} },
    meldcode: { total: 0, nieuw: 0, recent: 0 },
  };

  // Scholen + leraren
  try {
    const scholen = await listScholen();
    result.scholen.total = scholen.length;
    for (const s of scholen) {
      if (s.status === "actief") result.scholen.actief++;
      else if (s.status === "proef") result.scholen.proef++;
      else result.scholen.inactief++;
    }
    // Tel leraren in parallel (best-effort)
    const counts = await Promise.all(
      scholen.map(async (s) => {
        try {
          return (await listLerarenForSchool(s.id)).length;
        } catch {
          return 0;
        }
      })
    );
    result.leraren.total = counts.reduce((a, b) => a + b, 0);
  } catch (err) {
    console.warn("[beheer/stats] scholen:", err);
  }

  // Experts (rechtstreeks Airtable, zodat we OOK niet-beschikbare meenemen)
  try {
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(EXPERTS_TABLE_ID)}?pageSize=100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      const records: Array<{ fields: Record<string, unknown> }> = data.records || [];
      result.experts.total = records.length;
      result.experts.beschikbaar = records.filter((r) => r.fields?.["Beschikbaar"] === true).length;
    }
  } catch (err) {
    console.warn("[beheer/stats] experts:", err);
  }

  // Kenniskaarten
  try {
    const kaarten = await getAllKenniskaarten();
    result.kenniskaarten.total = kaarten.length;
    for (const k of kaarten) {
      const cat = k.categorie || "Onbekend";
      result.kenniskaarten.byCategorie[cat] = (result.kenniskaarten.byCategorie[cat] || 0) + 1;
    }
  } catch (err) {
    console.warn("[beheer/stats] kenniskaarten:", err);
  }

  // Gesprekken (direct fetch om duplicatie te vermijden)
  try {
    const base = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_API_TOKEN;
    if (base && token) {
      const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent("Gesprekken")}?pageSize=100&sort%5B0%5D%5Bfield%5D=Datum&sort%5B0%5D%5Bdirection%5D=desc`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const records: Array<{ fields: Record<string, unknown>; createdTime?: string }> = data.records || [];
        const now = Date.now();
        const h24 = 24 * 60 * 60 * 1000;
        const d7 = 7 * h24;
        result.gesprekken.total = records.length;
        for (const r of records) {
          const datum = (r.fields?.["Datum"] as string) || r.createdTime || "";
          const t = datum ? new Date(datum).getTime() : 0;
          if (t && now - t <= h24) result.gesprekken.last24h++;
          if (t && now - t <= d7) result.gesprekken.last7d++;
          const cat = (r.fields?.["Categorie"] as string) || "Onbekend";
          result.gesprekken.byCategorie[cat] = (result.gesprekken.byCategorie[cat] || 0) + 1;
        }
      }
    }
  } catch (err) {
    console.warn("[beheer/stats] gesprekken:", err);
  }

  // Meldcode
  try {
    const signalen = await listMeldcodeSignalen();
    result.meldcode.total = signalen.length;
    const now = Date.now();
    const d7 = 7 * 24 * 60 * 60 * 1000;
    for (const s of signalen) {
      if (s.status === "Nieuw") result.meldcode.nieuw++;
      const t = s.datum ? new Date(s.datum).getTime() : 0;
      if (t && now - t <= d7) result.meldcode.recent++;
    }
  } catch (err) {
    console.warn("[beheer/stats] meldcode:", err);
  }

  return NextResponse.json(result);
}
