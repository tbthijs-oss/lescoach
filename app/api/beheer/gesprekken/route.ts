import { NextRequest, NextResponse } from "next/server";

/**
 * Lijst van recente gesprekken (admin). Volgt datasetvorm van Gesprek in
 * lib/gesprekkenDb.ts maar leest direct uit Airtable zodat we over alle
 * scholen heen kunnen tonen (anders moeten we per school apart filteren).
 */
export async function GET(request: NextRequest) {
  const limitParam = Number(request.nextUrl.searchParams.get("limit") || 50);
  const limit = Math.min(Math.max(limitParam, 1), 200);

  const base = process.env.AIRTABLE_BASE_ID;
  const token = process.env.AIRTABLE_API_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ gesprekken: [] });
  }

  const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent("Gesprekken")}?pageSize=${Math.min(limit, 100)}&sort%5B0%5D%5Bfield%5D=Datum&sort%5B0%5D%5Bdirection%5D=desc`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ gesprekken: [], error: "Airtable error" }, { status: 502 });
    }
    const data = await res.json();
    const records: Array<{ id: string; fields: Record<string, unknown>; createdTime?: string }> =
      data.records || [];
    const gesprekken = records.slice(0, limit).map((r) => ({
      id: r.id,
      datum: (r.fields?.["Datum"] as string) || r.createdTime || "",
      zoekterm: (r.fields?.["Zoekterm"] as string) || "",
      categorie: (r.fields?.["Categorie"] as string) || "",
      kenniskaartTitels: (r.fields?.["Kenniskaarten"] as string) || "",
      primaryKaart: (r.fields?.["PrimaryKaart"] as string) || "",
      samenvatting: (r.fields?.["Samenvatting"] as string) || "",
      tokensIn: Number(r.fields?.["TokensIn"] || 0),
      tokensOut: Number(r.fields?.["TokensOut"] || 0),
      schoolIds: (r.fields?.["School"] as string[]) || [],
      leraarIds: (r.fields?.["Leraar"] as string[]) || [],
    }));
    return NextResponse.json({ gesprekken });
  } catch (err) {
    console.error("[beheer/gesprekken] GET:", err);
    return NextResponse.json({ gesprekken: [], error: "Fout" }, { status: 500 });
  }
}
