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
  if (body.naam !== undefined) fields["fldlIpS7xTWze43gJ"] = body.naam;
  if (body.titel !== undefined) fields["fldY7YAV7ZIsHpIu5"] = body.titel;
  if (body.bio !== undefined) fields["fldBMGbBncFIp5tPn"] = body.bio;
  if (body.specialisaties !== undefined) fields["fld0q7vkM7K0YfnBw"] = body.specialisaties;
  if (body.email !== undefined) fields["fld1PlJECsJv70w8G"] = body.email;
  if (body.telefoon !== undefined) fields["fldgCrSlOac82CwTB"] = body.telefoon;
  if (body.linkedin !== undefined) fields["fldx30ctWow9T40IN"] = body.linkedin;
  if (body.fotoUrl !== undefined) fields["fldsdq91TXomWNpWZ"] = body.fotoUrl;
  if (body.beschikbaar !== undefined) fields["flduj5f58FtEHZP6k"] = !!body.beschikbaar;
  if (body.ervaringsjaren !== undefined) fields["fldAX1Acb9wJu2p6F"] = Number(body.ervaringsjaren) || 0;
  if (body.regio !== undefined) fields["fldaePVPISVXp943r"] = body.regio;

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
