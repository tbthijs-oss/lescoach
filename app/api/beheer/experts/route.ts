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
    fldlIpS7xTWze43gJ: body.naam || "",
    fldY7YAV7ZIsHpIu5: body.titel || "",
    fldBMGbBncFIp5tPn: body.bio || "",
    fld0q7vkM7K0YfnBw: body.specialisaties || "",
    fld1PlJECsJv70w8G: body.email || "",
    fldgCrSlOac82CwTB: body.telefoon || "",
    fldx30ctWow9T40IN: body.linkedin || "",
    fldsdq91TXomWNpWZ: body.fotoUrl || "",
    flduj5f58FtEHZP6k: !!body.beschikbaar,
    fldAX1Acb9wJu2p6F: Number(body.ervaringsjaren) || 0,
    fldaePVPISVXp943r: body.regio || "",
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
