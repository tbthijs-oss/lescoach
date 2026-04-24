import { EXPERTS_TABLE_ID } from "@/lib/airtable";
import { NextRequest, NextResponse } from "next/server";

const EXPERTS_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${EXPERTS_TABLE_ID}`;

function airtableHeaders() {
  return {
    Authorization: `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// GET all experts (no filter — admin sees all)
export async function GET() {
  const res = await fetch(EXPERTS_URL, { headers: airtableHeaders() });
  if (!res.ok) {
    return NextResponse.json({ error: "Airtable error" }, { status: 502 });
  }
  const data = await res.json();
  return NextResponse.json(data.records || []);
}

// POST — create a new expert
export async function POST(request: NextRequest) {
  const body = await request.json();

  const fields = {
    Naam: body.naam || "",
    Titel: body.titel || "",
    Bio: body.bio || "",
    Specialisaties: body.specialisaties || "",
    Email: body.email || "",
    Telefoon: body.telefoon || "",
    LinkedIn: body.linkedin || "",
    "Foto URL": body.fotoUrl || "",
    Beschikbaar: !!body.beschikbaar,
    Ervaringsjaren: Number(body.ervaringsjaren) || 0,
    Regio: body.regio || "",
  };

  const res = await fetch(EXPERTS_URL, {
    method: "POST",
    headers: airtableHeaders(),
    body: JSON.stringify({ records: [{ fields }] }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Airtable POST error:", err);
    return NextResponse.json({ error: "Airtable error" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data.records?.[0] || {}, { status: 201 });
}
