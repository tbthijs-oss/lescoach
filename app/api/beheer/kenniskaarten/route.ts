import { NextResponse } from "next/server";
import { getAllKenniskaarten } from "@/lib/airtable";

export async function GET() {
  try {
    const kaarten = await getAllKenniskaarten();
    return NextResponse.json({ kenniskaarten: kaarten });
  } catch (err) {
    console.error("[beheer/kenniskaarten] GET:", err);
    return NextResponse.json({ error: "Kon kenniskaarten niet laden" }, { status: 502 });
  }
}
