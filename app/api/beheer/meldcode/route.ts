import { NextRequest, NextResponse } from "next/server";
import { listMeldcodeSignalen } from "@/lib/meldcodeDb";

export async function GET() {
  try {
    const signalen = await listMeldcodeSignalen();
    return NextResponse.json({ signalen });
  } catch (err) {
    console.error("[beheer/meldcode] GET:", err);
    return NextResponse.json({ signalen: [], error: "Fout" }, { status: 500 });
  }
}

/**
 * PATCH: update status van een signaal. Body: { id, status, beoordelingsNotitie? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, beoordelingsNotitie, beoordeeldDoor } = body || {};
    if (!id) return NextResponse.json({ error: "id ontbreekt" }, { status: 400 });

    const base = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_API_TOKEN;
    if (!base || !token) {
      return NextResponse.json({ error: "Airtable niet geconfigureerd" }, { status: 500 });
    }

    const fields: Record<string, unknown> = {};
    if (status !== undefined) fields["Status"] = status;
    if (beoordelingsNotitie !== undefined) fields["BeoordelingsNotitie"] = beoordelingsNotitie;
    if (beoordeeldDoor !== undefined) fields["BeoordeeldDoor"] = beoordeeldDoor;

    const url = `https://api.airtable.com/v0/${base}/${encodeURIComponent("MeldcodeSignalen")}/${id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[beheer/meldcode] PATCH:", err);
      return NextResponse.json({ error: "Airtable error" }, { status: 502 });
    }
    const data = await res.json();
    return NextResponse.json({ signaal: data });
  } catch (err) {
    console.error("[beheer/meldcode] PATCH:", err);
    return NextResponse.json({ error: "Fout" }, { status: 500 });
  }
}
