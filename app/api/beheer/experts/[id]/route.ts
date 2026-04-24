import { EXPERTS_TABLE_ID } from "@/lib/airtable";
import { NextRequest, NextResponse } from "next/server";


function expertUrl(id: string) {
  return `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${EXPERTS_TABLE_ID}/${id}`;
}

function airtableHeaders() {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// GET single expert
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(expertUrl(id), { headers: airtableHeaders() });
  if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(await res.json());
}

// PATCH — update expert
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const fields: Record<string, unknown> = {};
  if (body.naam !== undefined) fields["Naam"] = body.naam;
  if (body.titel !== undefined) fields["Titel"] = body.titel;
  if (body.bio !== undefined) fields["Bio"] = body.bio;
  if (body.specialisaties !== undefined) fields["Specialisaties"] = body.specialisaties;
  if (body.email !== undefined) fields["Email"] = body.email;
  if (body.telefoon !== undefined) fields["Telefoon"] = body.telefoon;
  if (body.linkedin !== undefined) fields["LinkedIn"] = body.linkedin;
  if (body.fotoUrl !== undefined) fields["Foto URL"] = body.fotoUrl;
  if (body.beschikbaar !== undefined) fields["Beschikbaar"] = !!body.beschikbaar;
  if (body.ervaringsjaren !== undefined) fields["Ervaringsjaren"] = Number(body.ervaringsjaren) || 0;
  if (body.regio !== undefined) fields["Regio"] = body.regio;

  const res = await fetch(expertUrl(id), {
    method: "PATCH",
    headers: airtableHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Airtable PATCH error:", err);
    return NextResponse.json({ error: "Airtable error" }, { status: 502 });
  }

  return NextResponse.json(await res.json());
}

// DELETE expert
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(expertUrl(id), {
    method: "DELETE",
    headers: airtableHeaders(),
  });

  if (!res.ok) return NextResponse.json({ error: "Airtable error" }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
