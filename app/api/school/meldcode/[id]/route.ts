import { NextRequest, NextResponse } from "next/server";
import { parseSession, AUTH_COOKIE } from "@/lib/auth";
import { getLeraar } from "@/lib/authDb";

/**
 * PATCH /api/school/meldcode/[id]
 * Body: { status: "Nieuw"|"Beoordeeld"|"Doorverwezen"|"Geen actie", beoordeeldDoor?: string, beoordelingsNotitie?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookie = request.cookies.get(AUTH_COOKIE.name);
  const session = parseSession(cookie?.value);
  if (!session || !session.leraarId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }
  if (session.leraarId !== "founder") {
    const leraar = await getLeraar(session.leraarId);
    if (!leraar || leraar.rol !== "admin") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => ({}));
  const fields: Record<string, unknown> = {};
  if (body.status && ["Nieuw", "Beoordeeld", "Doorverwezen", "Geen actie"].includes(body.status)) {
    fields.Status = body.status;
  }
  if (typeof body.beoordeeldDoor === "string") fields.BeoordeeldDoor = body.beoordeeldDoor.slice(0, 200);
  if (typeof body.beoordelingsNotitie === "string") fields.BeoordelingsNotitie = body.beoordelingsNotitie.slice(0, 2000);

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  try {
    const url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent("MeldcodeSignalen")}/${id}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "update_failed", detail: await res.text() }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err).slice(0, 200) }, { status: 500 });
  }
}
